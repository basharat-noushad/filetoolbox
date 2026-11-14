
## realesr-general-x4v3.onnx (Upscale Image)

- Model: Real-ESRGAN `realesr-general-x4v3` (SRVGGNetCompact, 4x), 4.9 MB fp32, dynamic H/W, input/output NCHW RGB float [0,1], output not clamped.
- Source: ONNX export by CoderViking, https://huggingface.co/CoderViking/realesr-general-x4v3-onnx (script `export_realesr.py` there), from the official weights `realesr-general-x4v3.pth` (Real-ESRGAN v0.2.5.0 release, sha256 8dc7edb9ac80ccdc30c3a5dca6616509367f05fbc184ad95b731f05bece96292).
- Licence: BSD-3-Clause, (c) Xintao Wang, https://github.com/xinntao/Real-ESRGAN/blob/master/LICENSE
- Used by: src/lib/tools/image/upscaleWorker.ts. The anime-6B variant and the denoise-strength interpolation were not added.

## modnet.onnx (Blur Image: Person mode)

- Model: MODNet trimap-free portrait matting, fp32, 512px working size, input NCHW RGB normalised to [-1,1], output 1x1xHxW alpha matte.
- Source: https://huggingface.co/Xenova/modnet (onnx/model.onnx), from https://github.com/ZHKKKe/MODNet
- Licence: Apache-2.0

## u2netp.onnx (Blur Image: Any subject mode)

- Model: U2-Net-p (small salient-object model), 320px input, ImageNet-normalised RGB, 4.6 MB.
- Source: https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2netp.onnx, weights from https://github.com/xuebinqin/U-2-Net
- Licence: Apache-2.0

## depth-anything-v2-small-q8.onnx (Blur Image: Portrait mode depth)

- Model: Depth Anything V2 Small, int8-quantised, 518px input, ImageNet-normalised RGB, output relative inverse depth (larger = nearer).
- Source: https://huggingface.co/onnx-community/depth-anything-v2-small (onnx/model_quantized.onnx), from https://huggingface.co/depth-anything/Depth-Anything-V2-Small
- Licence: Apache-2.0 (the Small variant only; Base/Large/Giant are CC-BY-NC)
