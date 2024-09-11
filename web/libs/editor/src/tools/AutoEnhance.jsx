import React from "react";
import { observer } from "mobx-react";
import { types } from "mobx-state-tree";

import BaseTool from "./Base";
import ToolMixin from "../mixins/Tool";

import { info, selectOption } from "../common/Modal/Modal";
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
    selectedEnhancementModel: types.maybeNull(types.string),
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

    setSelectedEnhancementModel(value) {
      self.selectedEnhancementModel = value;
    },

    handleEnhanceClick() {
      // Define the options for the select modal
      const options = [
        "Deblurring", "Denoising", "Deraining (Streak)", "Deraining (Drops)", 
        "Dehazing Indoor", "Dehazing Outdoor", "Enhancement (Low-light)", "Enhancement (Retouching)",];

      // Show the select option modal
      selectOption({
        title: "Select an Option for Enhancement",
        options,
        preselectedOption: self.selectedEnhancementModel,
        onSelect: (enhancementModel) => {
          self.setSelectedEnhancementModel(enhancementModel);
         },
        okText: "Next",
        onOkPress: () => {
          // After selecting an option, show the info modal
          info({
            title: "Autoenhance can take a while. Please be patient",
            okText: "Proceed",
            onOkPress: () => {
              self.autoEnhance(self.selectedEnhancementModel); // Pass the selected option to autoEnhance
            },
          });
        },     
      });
    },

    async autoEnhance(enhancementModel) {

      console.log(enhancementModel) 

      const apiUrl = window.location.protocol + "//" + window.location.host + "/api/autoenhance"

      self.setLoading(true);

      async function testPrerequisties() {
        try {
          const response = await fetch(apiUrl, {
            method: "GET",}
          );

          const contentType = response.headers.get('content-type');
          let data;
          
          if (contentType && contentType.indexOf('application/json') !== -1) {
            data = await response.json();
          }
          
          if (response.status !== 200) {
            throw new Error(data?.connection_status || 'Unknown error');
          } else {
            return 'success';
          }

        } catch (error) {
            throw new Error('Server connection failed: ' + error.message);
        }
      };

      async function sendImageToServer(data) {
        const response = await fetch(apiUrl, {
          method: 'POST',
          body: data,
        }
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
          throw new Error(canConnect);
        } else {  
          const image = self.obj;
          const imageRef = image.imageRef;

          const jsonStr = JSON.stringify({src: imageRef.src, enhancementModel});

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
