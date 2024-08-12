import React, { useRef, useState } from 'react';
import styled from 'styled-components';

import '@tensorflow/tfjs-backend-cpu';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import Image from 'next/image';
import { LiaSpinnerSolid } from 'react-icons/lia';
import { LuImagePlus } from 'react-icons/lu';
import TextDetectBtn from './TextDetectBtn';

// ImageDetection component
const TargetImg = styled.img`
  height: 100%;
`;

const TargetBox = styled.div`
  position: absolute;

  left: ${({ x }) => x + 'px'};
  top: ${({ y }) => y + 'px'};
  width: ${({ width }) => width + 'px'};
  height: ${({ height }) => height + 'px'};

  border: 2px solid #22c55e;
  background-color: transparent;
  z-index: 20;

  &::before {
    content: '${({ classType, score }) => `${classType} ${score.toFixed(1)}%`}';
    color: white;
    background-color: #22c55e;
    padding: 0 5px;
    font-weight: 500;
    font-size: 16px;
    position: absolute;
    top: -1.5em;
    left: -2px;
  }
`;

export function ImageDetection(props) {
  const fileInputRef = useRef();
  const imageRef = useRef();
  const [imgData, setImgData] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [isLoading, setLoading] = useState(false);

  const isEmptyPredictions = !predictions || predictions.length === 0;

  const openFilePicker = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const normalizePredictions = (predictions, imgSize) => {
    if (!predictions || !imgSize || !imageRef) return predictions || [];
    return predictions.map((prediction) => {
      const { bbox } = prediction;
      const oldX = bbox[0];
      const oldY = bbox[1];
      const oldWidth = bbox[2];
      const oldHeight = bbox[3];

      const imgWidth = imageRef.current.width;
      const imgHeight = imageRef.current.height;

      const x = (oldX * imgWidth) / imgSize.width;
      const y = (oldY * imgHeight) / imgSize.height;
      const width = (oldWidth * imgWidth) / imgSize.width;
      const height = (oldHeight * imgHeight) / imgSize.height;

      return { ...prediction, bbox: [x, y, width, height] };
    });
  };

  const detectObjectsOnImage = async (imageElement, imgSize) => {
    const model = await cocoSsd.load({});
    const predictions = await model.detect(imageElement, 6);
    const normalizedPredictions = normalizePredictions(predictions, imgSize);
    setPredictions(normalizedPredictions);
  };

  const readImage = (file) => {
    return new Promise((rs, rj) => {
      const fileReader = new FileReader();
      fileReader.onload = () => rs(fileReader.result);
      fileReader.onerror = () => rj(fileReader.error);
      fileReader.readAsDataURL(file);
    });
  };

  const onSelectImage = async (e) => {
    setPredictions([]);
    setLoading(true);

    const file = e.target.files[0];
    const imgData = await readImage(file);
    setImgData(imgData);

    const imageElement = document.createElement('img');
    imageElement.src = imgData;

    imageElement.onload = async () => {
      const imgSize = {
        width: imageElement.width,
        height: imageElement.height,
      };
      await detectObjectsOnImage(imageElement, imgSize);
      setLoading(false);
    };
  };

  return (
    <section className="min-w-[20vw] min-h-[20vh] h-full w-full border-2 border-primary">
      <div className="w-full h-full relative">
        {imgData && (
          <Image
            width={500}
            height={500}
            className="w-full h-full"
            alt="Selected Image"
            src={imgData}
            ref={imageRef}
          />
        )}
        {!isEmptyPredictions &&
          predictions.map((prediction, idx) => (
            <TargetBox
              key={idx}
              x={prediction.bbox[0]}
              y={prediction.bbox[1]}
              width={prediction.bbox[2]}
              height={prediction.bbox[3]}
              classType={prediction.class}
              score={prediction.score * 100}
            />
          ))}
        <div className="absolute top-5 right-5 z-50" onClick={openFilePicker}>
          {isLoading ? (
            <TextDetectBtn
              text={'Recognizing...'}
              icon={<LiaSpinnerSolid className="h-full w-full animate-spin" />}
            />
          ) : (
            <TextDetectBtn
              text={'Select_Image'}
              icon={<LuImagePlus className="h-full w-full" />}
            />
          )}
        </div>
      </div>
      <input hidden type="file" ref={fileInputRef} onChange={onSelectImage} />
    </section>
  );
}
