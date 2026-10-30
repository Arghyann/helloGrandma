import modal
import os

# ==============================================================================
# QWEN 2.5 14B — ARYAN FULL CORPUS TRAINING (30,090 SAMPLES)
#
# Specs:
#   - Model: unsloth/Qwen2.5-14B-Instruct (4-bit)
#   - Dataset: 30,090 examples from original corpus (clean ChatML format)
#   - Context Length: 2048
#   - LoRA: r=32, alpha=64 on all 7 linear projections
#   - Masking: train_on_responses_only (<|im_start|>assistant\n)
#   - Hardware: Modal A100 (40GB/80GB)
#   - Output: /data/aryan-qwen14b-full-lora
# ==============================================================================

app = modal.App("aryan-qwen14b-full")
volume = modal.Volume.from_name("aryan-finetune-vol", create_if_missing=True)

image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("git")
    .pip_install(
        "unsloth",
        "transformers",
        "datasets",
        "trl",
        "peft",
        "accelerate",
        "bitsandbytes",
        "torch",
    )
    .env({"HF_HOME": "/data/cache/huggingface"})
)

DATA_PATH = "/data/backup_corpus_messages.json"
SAVE_PATH = "/data/aryan-qwen14b-full-lora"
CHECKPOINT_DIR = "/data/checkpoints-qwen14b-full"

@app.function(
    gpu="A100",
    image=image,
    timeout=60 * 60 * 5,    # 5 hours max
    volumes={"/data": volume},
)
def train():
    from unsloth import FastLanguageModel
    from unsloth.chat_templates import get_chat_template, train_on_responses_only
    import json
    import torch
    from datasets import Dataset
    from trl import SFTTrainer, SFTConfig
    from transformers import TrainerCallback

    class ModalVolumeCallback(TrainerCallback):
        def __init__(self, vol):
            self.vol = vol

        def on_save(self, args, state, control, **kwargs):
            if state.is_world_process_zero:
                print(f"📦 Committing checkpoint {state.global_step} to Modal volume...")
                self.vol.commit()

    print(f"Loading data from {DATA_PATH}...")
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    print(f"Total training examples: {len(raw_data):,}")

    print("Loading Qwen 2.5 14B Instruct (4-bit)...")
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name="unsloth/Qwen2.5-14B-Instruct-bnb-4bit",
        max_seq_length=2048,
        dtype=None,
        load_in_4bit=True,
    )

    tokenizer = get_chat_template(tokenizer, chat_template="qwen-2.5")

    model = FastLanguageModel.get_peft_model(
        model,
        r=32,
        target_modules=[
            "q_proj", "k_proj", "v_proj", "o_proj",
            "gate_proj", "up_proj", "down_proj"
        ],
        lora_alpha=64,
        lora_dropout=0.05,
        bias="none",
        use_gradient_checkpointing="unsloth",
        random_state=42,
    )

    def formatting_prompts_func(examples):
        convos = examples["messages"]
        texts = [
            tokenizer.apply_chat_template(c, tokenize=False, add_generation_prompt=False)
            for c in convos
        ]
        return {"text": texts}

    dataset = Dataset.from_list(raw_data)
    dataset = dataset.map(formatting_prompts_func, batched=True)

    # 90/10 train/val split
    split = dataset.train_test_split(test_size=0.1, seed=42)
    print(f"Train size: {len(split['train']):,} | Val size: {len(split['test']):,}")

    trainer = SFTTrainer(
        model=model,
        processing_class=tokenizer,
        train_dataset=split["train"],
        eval_dataset=split["test"],
        callbacks=[ModalVolumeCallback(volume)],
        args=SFTConfig(
            output_dir=CHECKPOINT_DIR,
            max_seq_length=2048,
            packing=False,
            num_train_epochs=2,
            per_device_train_batch_size=2,
            gradient_accumulation_steps=8,  # Effective batch = 16
            learning_rate=1.5e-4,           # Optimal LoRA LR for large corpus
            warmup_steps=100,
            weight_decay=0.01,
            lr_scheduler_type="cosine",
            fp16=not torch.cuda.is_bf16_supported(),
            bf16=torch.cuda.is_bf16_supported(),
            eval_strategy="epoch",
            save_strategy="epoch",
            save_total_limit=3,
            load_best_model_at_end=True,
            metric_for_best_model="eval_loss",
            logging_steps=20,
            report_to="none",
            seed=42,
        ),
    )

    trainer = train_on_responses_only(
        trainer,
        instruction_part="<|im_start|>user\n",
        response_part="<|im_start|>assistant\n",
    )

    print("\n🚀 Starting Qwen 2.5 14B Full Corpus training...")
    stats = trainer.train()

    print(f"\n✅ Training complete! Final train loss: {stats.training_loss:.4f}")
    os.makedirs(SAVE_PATH, exist_ok=True)
    model.save_pretrained(SAVE_PATH)
    tokenizer.save_pretrained(SAVE_PATH)
    volume.commit()
    print(f"💾 Model saved to {SAVE_PATH}")

@app.local_entrypoint()
def main():
    import sys
    local_data = "final/backup_corpus_messages.json"
    if not os.path.exists(local_data):
        print(f"ERROR: {local_data} not found.")
        sys.exit(1)

    print(f"Uploading {local_data} (30k samples) to Modal volume...")
    with volume.batch_upload(force=True) as batch:
        batch.put_file(local_data, "backup_corpus_messages.json")
    print("Upload complete. Spawning cloud training job...")
    call = train.spawn()
    print(f"Job spawned! Call ID: {call.object_id}")
    print("Track logs: modal app logs aryan-qwen14b-full")
