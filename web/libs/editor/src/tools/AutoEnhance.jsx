import React, { useState, useEffect } from "react";
import { observer } from "mobx-react";
import { types } from "mobx-state-tree";

import BaseTool from "./Base";
import ToolMixin from "../mixins/Tool";

import { info } from "../common/Modal/Modal";
import Infomodal from "../components/Infomodal/Infomodal";
import Spinner from "../components/Spinner/Spinner";

import { Tool } from "../components/Toolbar/Tool";
import { IconAutoEnhance } from "../assets/icons";


const ToolView = observer(({ item }) => {
  return (
    <>
      <Tool
        active={item.selected}
        ariaLabel="autoenhance"
        label="AutoEnhance"
        onClick={() => { item.handleEnhanceClick(); }}
        icon={<IconAutoEnhance/>}
      />
    {item.loading && <Spinner />}
    </>
  );
});

const _Tool = types
  .model("AutoEnhance", {
    group: "control", 
    loading: false,
    error: types.maybeNull(types.string),
  })
  .views((self) => ({
    get viewClass() {
      return () => <ToolView item={self} />;
    },
  }))
  .actions((self) => ({

    setLoading(value) {
      self.loading = value;
    },

    handleEnhanceClick() {
     info({
        title: "Autoenhance can take a while. Please be patient",
        okText: "Proceed",
        onOkPress: () => {
          self.autoEnhance();
        },
      });
    },

    async autoEnhance() {

        self.setLoading(true);

        //localhost or 127... depending on server ToDo Fix

        async function testPrerequisties() {
          try {
            const response = await fetch('http://localhost:8080/api/autoenhance', {
              method: "GET",
              headers :{
                'SECRET_KEY': 'o1svcbi8vv44*9^0d-c3d866+h424)p1wh&(^nn(aw@v^+0x1q'
              } }
            );
            if (response.status !== 200){ 
              const data = await response.json();
              throw new Error(data.connection_status || 'Unknown error');
            } else {
              return 'success'; 
            } 
          } catch (error) {
              throw new Error('Server connection failed: ' + error.message);
          }
        };

        async function sendImageToServer(data) {
          const response = await fetch('http://localhost:8080/api/autoenhance', {
            method: 'POST',
            body: data,
            headers :{
              'SECRET_KEY': 'o1svcbi8vv44*9^0d-c3d866+h424)p1wh&(^nn(aw@v^+0x1q',
            }}
          );
          if (response.status === 200) {
            const server_response =  await response.json();
            return server_response;
          } else {
            if (response.status === 400) {
              const server_response =  await response.json();
              throw new Error(`Server error: ${server_response.Error}`);
            }
            else {
              throw new Error(`Server error: ${response.status}`);
            }
          }
        };
        try {
          const canConnect = await testPrerequisties()

          if (canConnect !== 'success') {
            console.log(canConnect);
          } else {  
            const image = self.obj;
            const imageRef = image.imageRef;

            const jsonStr = JSON.stringify({src: imageRef.src});

            const serverReply = await sendImageToServer(jsonStr);

            self.setLoading(false);

            if (serverReply.new_img_url !== undefined) {
              self.obj.setNewImageSource(serverReply.new_img_url);
            } else {
              self.obj.setNewImageSource(serverReply.enhanced_image_str);
            }
          }
        } catch (error) {
          Infomodal.error(error.message, "Error");
        } finally {
          self.setLoading(false);
        }
    },
  }));

const AutoEnhance = types.compose(_Tool.name, ToolMixin, BaseTool, _Tool);

export { AutoEnhance };
