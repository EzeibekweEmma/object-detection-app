# Object Detection

The Object Detection app identifies common objects from a live camera feed or an uploaded image. Inference runs locally in the browser with YOLO26s and LiteRT.js; selected images and camera frames are not uploaded to an application server.

![Object Detection demo](restaurant.png)

## Features

- Live camera detection with responsive bounding boxes
- Optional audio alert for a named object, such as `person` or `car`
- Image detection through file selection or drag and drop
- JPG, PNG, and WebP validation with a 10 MB upload limit
- More accurate YOLO26s detection with WebGPU acceleration and a WASM CPU path
- Shared, cached model loading when switching between camera and image modes
- Automatic COCO-SSD compatibility fallback if LiteRT cannot initialize
- Accessible controls, visible model state, and mobile-friendly layout

YOLO26s recognizes the 80 object categories in the COCO dataset. It is a general object detector, not a face-recognition model. COCO includes `knife`, `baseball bat`, and `scissors`, but it does not include a generic gun or weapon class. Detecting additional weapon types requires a custom-trained model.

## Run locally

Requirements: Node.js 22.13 or newer and pnpm 11.

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Camera access requires browser permission and a secure context (`localhost` is accepted by modern browsers).

## Quality checks

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Technology

- Next.js and React
- TypeScript and Tailwind CSS
- YOLO26s and LiteRT.js (WebGPU/WASM)
- TensorFlow.js and COCO-SSD (compatibility fallback)

## Model licensing

The bundled official YOLO26s model is licensed by Ultralytics under AGPL-3.0; see [public/models/README.md](public/models/README.md) for its source and checksum. Review that license before commercial or closed-source deployment. The application source code remains MIT-licensed.

## License

Licensed under the [MIT License](LICENSE).
