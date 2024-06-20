import React, { useState, useRef } from "react";
import { Tooltip } from "apps/labelstudio/src/components/Tooltip/Tooltip";
import { Button } from "../../../components";
import { Form, Input, Label } from "../../../components/Form";
import { cn } from "../../../utils/bem";
import { IconInfoOutline, LsMinus, LsPlus } from "../../../assets/icons";
import tags from "./schema.json";
import './empyconfigvisual.styl';

const configClass = cn("configure");

export const EmptyConfigVisual = ({ setTemplate, setConfigure }) => {
  const [dataType, setDataType] = useState('');
  const dataTagArray = useRef([]);
  const controlTagArray = useRef([])

  const objectTags = Object.entries(tags).filter(([_, value]) => value.type === 'ObjectTag');
  const labelControlTags = Object.entries(tags).filter(([_, value]) => value.type === 'LabelControlTag');

  const hasControlTagsForDataType = labelControlTags.some(([_, value]) => value.usefor === dataType);

  const handleDataTypeSelection = (event) => {
    setDataType(event.target.value);
  };

  const MiniCollapsable = ({handleClick, buttonName, heading, children}) => {
    
    const [collapsed, setCollapsed] = useState(true)

    return (
      <>
        <div className={configClass.elem("new-tag-heading")} 
        onClick={() => setCollapsed(collapsed ? false : true)}>
          <h4>{heading}</h4>
          <Button look="primary" size="small" onClick={handleClick}>{buttonName}</Button>
          <div className={configClass.elem('icon-wrapper')}>
            {collapsed ? <LsMinus /> : <LsPlus />}
          </div>
      </div>
      {!collapsed && children}
    </>
    )
  }

  const addToDataTagArray = (event) => {
    const { name, type, value, checked } = event.target;
    const inputValue = type === 'checkbox' ? checked : value;

    const existingIndex = dataTagArray.current.findIndex(tag => tag.tagName === name);
    if (existingIndex > -1) {
      if (dataTagArray.current[existingIndex].value !== inputValue) {
        dataTagArray.current[existingIndex] = { tagName: name, value: inputValue };
      }
    } else {
      dataTagArray.current.push({ tagName: name, value: inputValue });
    }
  };

  const addToControlTagArray = (event, tagId) => {
    const { name, type, value, checked } = event.target;
    const inputValue = type === 'checkbox' ? checked : value;

    const existingIndex = controlTagArray.current.findIndex(entry => entry[tagId]);
    if (existingIndex > -1) {
      controlTagArray.current[existingIndex][tagId][name] = inputValue;
    } else {
      controlTagArray.current.push({ [tagId]: { [name]: inputValue } });
    }
  };

  const addLabelToControlTagArray = (event, tagId, labelId) => {
    const { name, type, value, checked } = event.target;
    const inputValue = type === 'checkbox' ? checked : value;

    const relatedLabelObjectIndex = controlTagArray.current.findIndex(entry => entry[tagId]);
    if (relatedLabelObjectIndex > -1) {
      const tagEntry = controlTagArray.current[relatedLabelObjectIndex][tagId];

      if (tagEntry.label) {
        const labelIndex = tagEntry.label.findIndex(label => label.hasOwnProperty(labelId));
        if (labelIndex > -1) {
          tagEntry.label[labelIndex][labelId][name] = inputValue;
        } else {
          tagEntry.label.push({ [labelId]: { [name]: inputValue } });
        }
      } else {
        tagEntry.label = [{ [labelId]: { [name]: inputValue } }];
      }
    } else {
      controlTagArray.current.push({
        [tagId]: {
          label: [{ [labelId]: { [name]: inputValue } }]
        }
      });
    }
  };

  const createTemplate = () => {
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
      const labelType = id.split("_")[0];
      const attributes = entry[id];
      const attributeStrings = Object.entries(attributes)
        .filter(([key]) => key !== 'label')
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ');

      let labelString = '';
      if (attributes.label) {
        labelString = attributes.label.map(label => {
          const labelId = Object.keys(label)[0];
          const labelAttributes = label[labelId];
          const labelAttributeStrings = Object.entries(labelAttributes)
            .filter(([_, value]) => value !== false)
            .map(([key, value]) => `${key}="${value}"`)
            .join(' ');
          return `<Label ${labelAttributeStrings} />`;
        }).join('\n');
        return `<${labelType} ${attributeStrings}>
    ${labelString}
</${labelType}>`;
      } else {
        return `<${labelType} ${attributeStrings} />`;
      }
    }).join('\n');

    setTemplate(`<View>
      <${dataType} ${dataTagConfig}/>
      ${controlTagConfig}
    </View>`);
    setConfigure('code');
  };

  const CreateSubForms = ({ selectedValue, handleOptionSelection }) => {
    const dataTypeAttributes = tags[selectedValue]?.attrs ?? {};
    return (
      <div className={configClass.elem("individual-sub-forms")}>
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

  const SubLabelInfo = ({ tagId }) => {
    const [labels, setLabels] = useState([]);

    const addNewLabel = () => {
      setLabels([...labels, { id: `label_${labels.length}`, type: 'Label' }]);
    };

    const removeLabel = (labelId) => {
      setLabels(labels.filter(label => label.id !== labelId));
    };
    // ToDo: Mini Collabalbe hides the Button and therefore can never be rendered, adjust button somehow
    return (
      <div>
        {labels.map(label => (
          <>
          <MiniCollapsable
            heading={label.id}
            handleClick={() => removeLabel(label.id)}
            buttonName="Remove"
          >
            <div key={label.id} className={configClass.elem("sub-label-info")}>
              <CreateSubForms
                selectedValue={label.type}
                handleOptionSelection={(event) => addLabelToControlTagArray(event, tagId, label.id)}
              />
            </div>
            </MiniCollapsable>
          </>
      ))}
      <Button look="primary" size="small" onClick={addNewLabel} className={configClass.elem("add-label-button")}>
        Add Label
      </Button>
      </div>
    );
  };

  const TagSelection = ({ controlTags, onTagChange, addControlTag }) => {
    const [selectedOptions, setSelectedOptions] = useState([]);
    const [tagIds, setTagIds] = useState({});

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

    const handleAddControlTag = () => {
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
      addControlTag([...controlTags, ...newTags]);
      setSelectedOptions([]);
    };

    return (
      <div className="form-group">
        <label htmlFor="object-select">Select Control Tags</label>
        <div className={configClass.elem("add-label-container")}>
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
          <Button look="primary" size="compact" onClick={handleAddControlTag}>Add</Button>
        </div>
      </div>
    );
  };

  const SelectControlTags = () => {
    const [controlTags, setControlTags] = useState([]);
    
    const controlTagArray = useRef([]);

    const handleTagChange = (tags) => {
      setControlTags(tags);
    };

    const addControlTag = (tags) => {
      setControlTags(tags);
    };

    const removeControlTag = (tagId) => {
      const newTags = controlTags.filter(tag => tag.id !== tagId);
      setControlTags(newTags);
      const existingIndex = controlTagArray.current.findIndex(entry => entry[tagId]);
      if (existingIndex > -1) {
        controlTagArray.current.splice(existingIndex, 1);
      }
    };

    return (
      <div>
        <TagSelection
          controlTags={controlTags}
          onTagChange={handleTagChange}
          addControlTag={addControlTag}
        />
          {controlTags.map(tag => (
              <div className={configClass.elem("menu-item-content")}>
                <MiniCollapsable 
                  handleClick={() => removeControlTag(tag.id)}
                  buttonName = "Remove"
                  heading = {tag.type}
                >
                  <CreateSubForms
                    key={tag.id}
                    selectedValue={tag.type}
                    handleOptionSelection={(event) => addToControlTagArray(event, tag.id)}
                  />
                  <div style={{ height: '15px'}}> </div> {/*Add some spacing in between label and sublabel*/}
                  {tag.needsLabel && <SubLabelInfo tagId={tag.id} />}
               </MiniCollapsable>
            </div>
          ))}
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
          {dataType && hasControlTagsForDataType && <SelectControlTags />}
        </Form.Row>
        <Form.Actions size="small">
          <Button look="primary" size="large" style={{ width: 120 }} onClick={createTemplate}>
            Create New Template
          </Button>
        </Form.Actions>
      </Form>
    </div>
  );
};
