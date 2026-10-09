import { AutoModelForImageClassification, AutoProcessor, RawImage } from "@huggingface/transformers";

// Community Forensics ViT-Small (Park & Owens, CVPR 2025), MIT licence.
// Single-logit output: sigmoid(logit) = probability the image is AI-generated.
export const FORENSIC_MODEL = process.env.FORENSIC_MODEL || "buildborderless/CommunityForensics-DeepfakeDet-ViT";
export const FORENSIC_VARIANT = "ONNX int8 (quantized, 23 MB)";

let loading = null;

function load() {
  if (!loading) {
    loading = Promise.all([
      AutoProcessor.from_pretrained(FORENSIC_MODEL),
      AutoModelForImageClassification.from_pretrained(FORENSIC_MODEL, { dtype: "q8" }),
    ]).catch((err) => {
      loading = null;
      throw err;
    });
  }
  return loading;
}

export function warmUpForensicModel() {
  const started = Date.now();
  load()
    .then(() => console.log(`Forensic model ready in ${((Date.now() - started) / 1000).toFixed(1)}s`))
    .catch((err) => console.warn("Forensic model unavailable:", err.message));
}

export async function detectAIImage(buffer, mimeType) {
  const [processor, model] = await load();
  const image = await RawImage.fromBlob(new Blob([buffer], { type: mimeType }));
  const inputs = await processor(image);
  const { logits } = await model(inputs);
  const logit = Number(logits.data[0]);
  return { fakeProbability: 1 / (1 + Math.exp(-logit)), model: FORENSIC_MODEL, variant: FORENSIC_VARIANT };
}
