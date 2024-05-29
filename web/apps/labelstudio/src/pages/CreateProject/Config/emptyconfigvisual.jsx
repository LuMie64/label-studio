import React, { useState } from "react";

import { Tooltip } from "apps/labelstudio/src/components/Tooltip/Tooltip";
import { Button } from "../../../components";
import { Form, Input, Label } from "../../../components/Form";
import { cn } from "../../../utils/bem";

import {IconInfoOutline} from "../../../assets/icons"

import tags from "./schema.json";

import './empyconfigvisual.styl'

const configClass = cn("configure");

export const EmptyConfigVisual = ({ setTemplate, setConfigure }) => {

    const [selectedValue, setSelectedValue] = useState('');
    const [tagArray, setTagArray] = useState([]);
  
    const handleObjectSelection = (event) => {
      setSelectedValue(event.target.value);
    };
  
    const handleOptionSelection = (event) => {
      const { name, type, value, checked } = event.target;
      const inputValue = type === 'checkbox' ? checked : value;
  
      setTagArray(prevValues => {
        const existingIndex = prevValues.findIndex(tag => tag.tagName === name);
  
        if (existingIndex > -1) {
          const updatedValues = [...prevValues];
          updatedValues[existingIndex] = { tagName: name, value: inputValue };
          return updatedValues;
        } else {
          return [...prevValues, { tagName: name, value: inputValue }];
        }
      });
    };
  
    const createTemplate = () => {
      let hasNameTag = false;
      let hasValueTag = false;
  
      const filteredTagArray = tagArray.filter(tag => {
        if (tag.tagName === 'name') {
          hasNameTag = tag.value.trim() !== '';
          return hasNameTag;
        }
        if (tag.tagName === 'value') {
          hasValueTag = tag.value.trim() !== '';
          return hasValueTag;
        }
        return true;
      });
  
      const additionalTags = [];
      if (!hasNameTag) {
        additionalTags.push({ tagName: 'name', value: selectedValue });
      }
      if (!hasValueTag) {
        additionalTags.push({ tagName: 'value', value: `$${selectedValue}` });
      }
  
      const allTags = [...additionalTags, ...filteredTagArray];
      const tagConfig = allTags.map(tag => `${tag.tagName}="${tag.value}"`).join(' ');
  
      setTemplate(`<View>
        <${selectedValue} ${tagConfig}/>
  </View>`);
      setConfigure('code');
    };
  
    const dataTypeOptions = () => {
      const dataTypeAttributes = tags[selectedValue]?.attrs ?? {};
      return (
        <div className={configClass.elem("data-type-options")}>
          {Object.values(dataTypeAttributes).map(item => {
            if (item.type === 'string') {
              return (
                <Label 
                    text={item.name} 
                    description={
                        <Tooltip title={item.description} alignment="bottom-center">
                            <IconInfoOutline/>
                         </Tooltip>}
                >
                    <Input
                        type="text"
                        name={item.name}
                        defaultValue={item.default !== false ? item.default : ''}
                        onChange={handleOptionSelection}
                    /> 
                </Label>
              );
            } else if (Array.isArray(item.type)) {
              return (
                <Label 
                    text={item.name} 
                    description={
                    <Tooltip title={item.description} alignment="bottom-center">
                        <IconInfoOutline/>
                     </Tooltip>}
                >
                  <Input
                    type="checkbox"
                    name={item.name}
                    onChange={handleOptionSelection}
                  />
                </Label>  
              );
            }
            return null;
          })}
        </div>
      );
    };
  
    return (
      <div className={configClass.elem("empty-config")}>
        <Form>
          <div className={configClass.elem("form-group")}>
            <label htmlFor="object-select">Select Data Type: </label>
            <select id="object-select" value={selectedValue} onChange={handleObjectSelection}>
              <option value="" disabled>Data Types</option>
              {Object.entries(tags).map(([key, value]) => (
                value.type === 'ObjectTag' && (
                  <option key={key} value={key}>
                    {key}
                  </option>
                )
              ))}
            </select>
          </div>
          <Form.Row columnCount={1} rowGap="32px">
            {selectedValue && dataTypeOptions()}
          </Form.Row>
          <Form.Actions size="small">
            <Button look="primary" size="compact" style={{ width: 120 }} onClick={createTemplate}>
              Create New Template
            </Button>
          </Form.Actions>
        </Form>
      </div>
    );
};
  