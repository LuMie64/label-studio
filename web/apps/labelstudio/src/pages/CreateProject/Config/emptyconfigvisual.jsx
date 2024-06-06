import React, { useState, useRef } from "react";
import { Tooltip } from "apps/labelstudio/src/components/Tooltip/Tooltip";
import { Button, Menu } from "../../../components";
import { Form, Input, Label } from "../../../components/Form";
import { cn } from "../../../utils/bem";
import { IconInfoOutline } from "../../../assets/icons";
import tags from "./schema.json";
import './empyconfigvisual.styl';

const configClass = cn("configure");

export const EmptyConfigVisual = ({ setTemplate, setConfigure }) => {
  const [dataType, setDataType] = useState('');
  const dataTagArray = useRef([]);
  const controlTagArray = useRef([])
  
  // Filtering tags for ObjectTag and LabelControlTag types
  const objectTags = Object.entries(tags).filter(([_, value]) => value.type === 'ObjectTag');
  const labelControlTags = Object.entries(tags).filter(([_, value]) => value.type === 'LabelControlTag');
 
  const hasControlTagsForDataType = labelControlTags.some(([_, value]) => value.usefor === dataType); // ToDo: This should be an Array


  const handleDataTypeSelection = (event) => {
    setDataType(event.target.value);
  };

  const addToDataTagArray = (event) => {

    const { name, type, value, checked } = event.target;
    
    const inputValue = type === 'checkbox' ? checked : value;

    const existingIndex = dataTagArray.current.findIndex(tag => tag.tagName === name);
    
    if (existingIndex > -1) {
      // Check if the value has actually changed
      if (dataTagArray.current[existingIndex].value !== inputValue) {
        dataTagArray.current[existingIndex] = { tagName: name, value: inputValue };
      }
    } else {
      dataTagArray.current.push({ tagName: name, value: inputValue});
    }
  };

  const addToControlTagArray = (event, tagId) => {
    const { name, type, value, checked } = event.target;
    const inputValue = type === 'checkbox' ? checked : value;
  
    const existingIndex = controlTagArray.current.findIndex(entry => entry[tagId]);
  
    if (existingIndex > -1) {
      // Update existing entry
      controlTagArray.current[existingIndex][tagId][name] = inputValue;
    } else {
      // Create new entry
      controlTagArray.current.push({ [tagId]: { [name]: inputValue } });
    }
  
    console.log(controlTagArray.current);
  };
  


  const createTemplate = () => {

    console.log(dataTagArray.current)

    let hasNameTag = false;
    let hasValueTag = false;

    const filteredTagArray = dataTagArray.current.filter(tag => {
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
      additionalTags.push({ tagName: 'name', value: dataType });
    }
    if (!hasValueTag) {
      additionalTags.push({ tagName: 'value', value: `$${dataType}` });
    }

    const allTags = [...additionalTags, ...filteredTagArray];
    const dataTagConfig = allTags.map(tag => `${tag.tagName}="${tag.value}"`).join(' ');

    const controlTagConfig = controlTagArray.current.map(entry => {
      const id = Object.keys(entry)[0];
      const attributes = entry[id];
      const attributeStrings = Object.entries(attributes)
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ');
      return `<${id.split("_").pop()} ${attributeStrings}/>`;
  });
  
    setTemplate(`<View>
      <${dataType} ${dataTagConfig}/>
      ${controlTagConfig}
    </View>`);
    setConfigure('code');
  };

  const CreateSubForms = ({ selectedValue, handleOptionSelection }) => {
    const dataTypeAttributes = tags[selectedValue]?.attrs ?? {};
    return (
      <div className="data-type-options">
        {Object.values(dataTypeAttributes).map(item => {
          if (item.type === 'string') {
            return (
              <Label 
                key={item.name}
                text={item.name} 
                description={
                  <Tooltip title={item.description} alignment="bottom-center">
                    <IconInfoOutline />
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
                key={item.name}
                text={item.name} 
                description={
                  <Tooltip title={item.description} alignment="bottom-center">
                    <IconInfoOutline />
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

  const SubLabelInfo = () => {
    const [labels, setLabels] = useState([]);
  
    const addNewLabel = () => {
      setLabels([...labels, { id: `label_${labels.length}`, type: 'Label' }]);
    };
  
    const removeLabel = (labelId) => {
      setLabels(labels.filter(label => label.id !== labelId));
    };
  
    return (
      <div>
        <button onClick={addNewLabel}>Add Label</button>
        {labels.map(label => (
          <div key={label.id} className="label-container">
            <h3>{label.id}</h3>
            <CreateSubForms
              selectedValue={label.type}
              handleOptionSelection={(event) => console.log(event.target.value)}
            />
            <button onClick={() => removeLabel(label.id)}>Remove</button>
          </div>
        ))}
      </div>
    );
  };

  const TagSelection = ({ onTagChange }) => {
    const [selectedOptions, setSelectedOptions] = useState([]);
    const [tagIds, setTagIds] = useState({});
    const [controlTags, setControlTags] = useState([]);

    const handleSelectionChange = (event) => {
      const options = event.target.options;
      const selected = [];
      for (let i = 0; i < options.length; i++) {
        if (options[i].selected) {
          selected.push(options[i].value);
        }
      }
      setSelectedOptions(selected);
    };

    const addControlTag = () => {
      const newTagIds = { ...tagIds };
      const newTags = selectedOptions.map(option => {
        newTagIds[option] = (newTagIds[option] || 0) + 1;
        return {
          id: option + '_' + newTagIds[option],
          type: option,
          needsLabel: tags[option]?.needsLabel || false,
        };
      });
    
      setTagIds(newTagIds);
      setControlTags([...controlTags, ...newTags]);
      setSelectedOptions([]);
      onTagChange([...controlTags, ...newTags]);
    };

    const removeControlTag = (tagId) => {
      const newTags = controlTags.filter(tag => tag.id !== tagId);
      setControlTags(newTags);
      onTagChange(newTags);
      const existingIndex = controlTagArray.current.findIndex(entry => entry[tagId])
      if (existingIndex > -1) {
        controlTagArray.current.splice(existingIndex, 1)
      }
    };

    return (
      <div className="form-group">
        <label htmlFor="object-select">Select Control Tags</label>
        <div>
          <select 
            id="object-select" 
            value={selectedOptions} 
            onChange={handleSelectionChange} 
            multiple
          >
            <option value="" disabled>Control Tags</option>
            {labelControlTags.map(([key]) => (
              tags[key].usefor === dataType && (
                <option key={key} value={key}>
                  {key}
                </option>
              )
            ))}
          </select>
          <button onClick={addControlTag}>Add</button>
        </div>
        <div>
          <p>Selected Control Tags:</p>
          <ul>
            {controlTags.map(tag => (
              <li key={tag.id}>
                {tag.id}
                <button onClick={() => removeControlTag(tag.id)}>Remove</button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  const SelectControlTags = () => {
    const [menuTags, setMenuTags] = useState([]);
    const [collapsedTags, setCollapsedTags] = useState({});

    const handleTagChange = (tags) => {
      console.log(menuTags)
      setMenuTags(tags);
    };

    const toggleCollapse = (tagId) => {
      setCollapsedTags(prevState => ({
        ...prevState,
        [tagId]: !prevState[tagId]
      }));
    };

    return (
      <div>
        <TagSelection onTagChange={handleTagChange} />
        <Menu>
          {menuTags.map(tag => (
            <React.Fragment key={tag.id}>
              <Menu.Item onClick={() => toggleCollapse(tag.id)}>
                {tag.id}
              </Menu.Item>
              {!collapsedTags[tag.id] && (
                <div className="menu-item-content">
                  <h4>{tag.type}</h4>
                  <CreateSubForms 
                    key={tag.id}
                    selectedValue={tag.type} 
                    handleOptionSelection={(event) => addToControlTagArray(event, tag.id)}
                  />
                {tag.needsLabel && < SubLabelInfo /> }
                </div>
              )}
            </React.Fragment>
          ))}
        </Menu>
      </div>
    );
  };
  
  return (
    <div className={configClass.elem("empty-config")}>
      <Form>
        <div className={configClass.elem("form-group")}>
          <label htmlFor="object-select">Select Data Type: </label>
          <select id="object-select" value={dataType} onChange={handleDataTypeSelection}>
            <option value="" disabled>Data Types</option>
            {objectTags.map(([key]) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </div>
        <Form.Row columnCount={1} rowGap="32px">
          {dataType && 
            <CreateSubForms 
              selectedValue={dataType} 
              handleOptionSelection={addToDataTagArray} 
            />
          }
        </Form.Row>
        {dataType && hasControlTagsForDataType && <SelectControlTags />}
        <Form.Actions size="small">
          <Button look="primary" size="compact" style={{ width: 120 }} onClick={createTemplate}>
            Create New Template
          </Button>
        </Form.Actions>
      </Form>
    </div>
  );
};
