# SlimSAM for isolated menu containers

Model: https://huggingface.co/Xenova/slimsam-77-uniform (Apache-2.0).
Original work: https://github.com/czg1225/SlimSAM and https://github.com/facebookresearch/segment-anything.

- sam-encoder.onnx: main/onnx/vision_encoder_quantized.onnx
- sam-decoder.onnx: points-and-boxes/onnx/prompt_encoder_mask_decoder_quantized.onnx
- Both files are vendored; runtime never downloads executable/model code.
- SAM-LICENSE contains Apache-2.0 terms.

Inputs: longest edge 1024, RGB/255 normalized with mean .485,.456,.406 / std .229,.224,.225, zero padding after normalization. Gemini supplies a whole-container box, not a generated image or final mask. The decoder receives the box and center point. Masks clipped at the original edge or differing substantially from the full box are rejected. Outputs retain original pixels on a white canvas with a guaranteed margin.

No segmentation API fee. Gemini review, CPU, storage and transfer consume the configured provider quotas.
cce23c7b2e5d4f330932738fb67ba518e04b0d99ccdd1cccd22a7da4e01f2971  server/models/sam-encoder.onnx
e95d495de5db3bd02d303c525b3003287c6df3d231c7b358559a5520c96fd372  server/models/sam-decoder.onnx
