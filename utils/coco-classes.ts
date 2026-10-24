export const COCO_OBJECT_GROUPS = [
  { label: 'People', objects: ['person'] },
  {
    label: 'Vehicles',
    objects: ['bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat'],
  },
  {
    label: 'Outdoor',
    objects: ['traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench'],
  },
  {
    label: 'Animals',
    objects: ['bird', 'cat', 'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe'],
  },
  {
    label: 'Accessories',
    objects: ['backpack', 'umbrella', 'handbag', 'tie', 'suitcase'],
  },
  {
    label: 'Sports',
    objects: [
      'frisbee',
      'skis',
      'snowboard',
      'sports ball',
      'kite',
      'baseball glove',
      'skateboard',
      'surfboard',
      'tennis racket',
    ],
  },
  {
    label: 'Kitchen',
    objects: ['bottle', 'wine glass', 'cup', 'fork', 'spoon', 'bowl'],
  },
  {
    label: 'Potential weapons',
    objects: ['knife', 'baseball bat', 'scissors'],
  },
  {
    label: 'Food',
    objects: ['banana', 'apple', 'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake'],
  },
  {
    label: 'Furniture',
    objects: ['chair', 'couch', 'potted plant', 'bed', 'dining table', 'toilet'],
  },
  {
    label: 'Electronics',
    objects: ['tv', 'laptop', 'mouse', 'remote', 'keyboard', 'cell phone'],
  },
  {
    label: 'Appliances',
    objects: ['microwave', 'oven', 'toaster', 'sink', 'refrigerator'],
  },
  {
    label: 'Indoor',
    objects: ['book', 'clock', 'vase', 'teddy bear', 'hair drier', 'toothbrush'],
  },
] as const;
