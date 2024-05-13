import React, { useState, useEffect } from "react";
import { observer } from "mobx-react";
import { types, getEnv } from "mobx-state-tree";

import BaseTool from "./Base";
import ToolMixin from "../mixins/Tool";
import { getTransformedImageData } from "../utils/image";
import { useAPI } from "../../../../apps/labelstudio/src/providers/ApiProvider"

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

        self.loading = true

        async function testPrerequisties() {
          const response = await fetch('http://127.0.0.1:8080/api/autoenhance', {
            method: "GET",
            headers :{
              'SECRET_KEY': 'o1svcbi8vv44*9^0d-c3d866+h424)p1wh&(^nn(aw@v^+0x1q'
            } }
          );
          
        const data = await response.json()

        return data
        }

        const api = useAPI();
        const data = await api.callApi("checkMaximPrerequisite");

        console.log(testPrerequisties())

        console.log(data)

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
        console.log(transformedData)
        console.log(process.env)

        // get image properties from ImageRef, use getTransformedImageData to get pixel values, send to python, perform magic adjust source of image??
    },
  }));

const AutoEnhance = types.compose(_Tool.name, ToolMixin, BaseTool, _Tool);

export { AutoEnhance };
