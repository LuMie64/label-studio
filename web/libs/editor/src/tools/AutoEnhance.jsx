import React, { useState, useEffect } from "react";
import { observer } from "mobx-react";
import { types, getEnv } from "mobx-state-tree";

import BaseTool from "./Base";
import ToolMixin from "../mixins/Tool";
import { getTransformedImageData } from "../utils/image";

import { Tool } from "../components/Toolbar/Tool";
import { IconBrightnessTool, IconHandTool} from "../assets/icons";


const ToolView = observer(({ item }) => {
  return (
    <Tool
      active={item.selected}
      ariaLabel="autoenhance"
      label="AutoEnhance"
      onClick={() => {item.autoEnhance();}}
      icon={item.loading ? <IconHandTool /> : <IconBrightnessTool />}
    />
  );
});

const _Tool = types
  .model("AutoEnhance", {
    group: "control",    
  })
  .views((self) => ({
    get viewClass() {
      return () => <ToolView item={self} />;
    },
  }))
  .actions((self) => ({
    async autoEnhance() {

        self.loading = true;

        //localhost or 127... depending on server 

        async function testPrerequisties() {
          console.log('now this')
          const response = await fetch('http://localhost:8080/api/autoenhance', {
            method: "GET",
            headers :{
              'SECRET_KEY': 'o1svcbi8vv44*9^0d-c3d866+h424)p1wh&(^nn(aw@v^+0x1q'
            } }
          );
          if (response.status !== 200){ 
            const data = await response.json();
            return data.connection_staus;
          } else {
            return 'success';
          }
        };

        async function sendImageToServer(formData) {
          console.log(formData)
          const response = await fetch('http://localhost:8080/api/autoenhance', {
            method: 'POST',
            body: formData,
            headers :{
              'SECRET_KEY': 'o1svcbi8vv44*9^0d-c3d866+h424)p1wh&(^nn(aw@v^+0x1q',
            }}
          );
          if (response.status === 200) {
            const data =  await response.json();
            return data;
          } else {
            print(response.status)
          }
        };

        const canConnect = await testPrerequisties()

        console.log(canConnect)

        if (canConnect !== 'success') {
          console.log(canConnect)
        } else {  
          const image = self.obj;
          const imageRef = image.imageRef;
          const viewportWidth = Math.round(image.canvasSize.width);
          const viewportHeight = Math.round(image.canvasSize.height);
          const [transformedData, transformedCanvas] = getTransformedImageData(
            imageRef, 
            imageRef.naturalWidth, 
            imageRef.naturalHeight, 
            imageRef.width, 
            imageRef.height, 
            viewportWidth, 
            viewportHeight,
            image.zoomScale,
            image.zoomingPositionX, 
            image.zoomingPositionY, 
            image.zoomScale > 1
          )

          console.log(imageRef.src)

          const newTransformedData = {
            width: transformedData.width,
            height: transformedData.height,
            src: imageRef.src
          };

          const jsonStr = JSON.stringify(newTransformedData);

          const blob = new Blob([jsonStr], { type: 'application/json' });
          // Use FormData to send the Blob
          const formData = new FormData();
          formData.append('file', blob, 'filename.json');

          const serverReply = await sendImageToServer(formData);

          console.log(self.obj)

          self.obj.set
          
          self.obj.setImageSource(serverReply.new_img_url)

          console.log(serverReply)

        }
       // get image properties from ImageRef, use getTransformedImageData to get pixel values, send to python, perform magic adjust source of image??
    },
  }));

const AutoEnhance = types.compose(_Tool.name, ToolMixin, BaseTool, _Tool);

export { AutoEnhance };
