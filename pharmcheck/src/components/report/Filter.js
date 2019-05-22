import React, { Component } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import Select from 'react-select';
import CreatableSelect from 'react-select/lib/Creatable';
import uuid from 'uuid/v4';
import {InputGroup} from 'react-bootstrap';
import DatePicker from "react-datepicker";
import ErrorBoundary from '@components/common/ErrorBoundary';
import {toJS} from 'mobx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt } from '@fortawesome/free-regular-svg-icons';
import { Portal } from 'react-overlays';
import * as moment from 'moment';
const offset = moment().utcOffset();
import { observer, inject } from 'mobx-react';
import {Card} from 'react-bootstrap';
import _ from 'lodash';

const datepickerFormat = "MM.DD.YYYY";

const getFieldItemStyle = (isDragging, draggableStyle) => ({
  // styles we need to apply on draggables
  ...draggableStyle,
});

const getSelectedListStyle = isDraggingOver => ({
  background: isDraggingOver ? 'lightblue' : 'transparent',
});

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

const CalendarContainer = ({children}) => {
  const el = document.getElementById('calendar-portal');

  return (
    <Portal container={el}>
      {children}
    </Portal>
  )
};

const CreatableItem = ({onRemove, item, index}) => {
  return (
    <div className="creatable-items__item">
      <div className="creatable-items__item-label">
        {typeof item === 'string' ? item : item.format(datepickerFormat)}
      </div>
      <div className="creatable-items__item-remove" onClick={onRemove.bind(null, index)}>
        <svg height="14" width="14" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M14.348 14.849c-0.469 0.469-1.229 0.469-1.697 0l-2.651-3.030-2.651 3.029c-0.469 0.469-1.229 0.469-1.697 0-0.469-0.469-0.469-1.229 0-1.697l2.758-3.15-2.759-3.152c-0.469-0.469-0.469-1.228 0-1.697s1.228-0.469 1.697 0l2.652 3.031 2.651-3.031c0.469-0.469 1.228-0.469 1.697 0s0.469 1.229 0 1.697l-2.758 3.152 2.758 3.15c0.469 0.469 0.469 1.229 0 1.698z" /></svg>
      </div>
    </div>
  )
};

@inject('ReferenceStore')
export class FilterItem extends Component {

  placeholder = "Введите значение для сравнения";
  input1 = null;
  input2 = null;

  constructor(props) {
    super(props);
    this.options = [
      {
        value: "eq",
        label: "равно"
      },
      {
        value: "neq",
        label: "не равно"
      },
      {
        value: "cn",
        label: "содержит"
      },
      {
        value: "ncn",
        label: "не содержит"
      },
      {
        value: "nl",
        label: "пусто"
      },
      {
        value: "nnl",
        label: "не пусто"
      },
      {
        value: "ls",
        label: "в списке"
      },
      {
        value: "nls",
        label: "не в списке"
      },
      {
        value: "gt",
        label: "больше"
      },
      {
        value: "lt",
        label: "меньше"
      }
    ];
    const {key, type, condition, value, value2} = this.props.value;
    let options = [];
    if (['date', 'number'].indexOf(type) > -1) {
      options = this.options.slice();
      if (['date'].indexOf(type) > -1) {
        options.push({
          value: "btw",
          label: "между"
        });
      }
    } else {
      options = this.options.slice(0, 8);
    }
    this.state = {
      conditionOptions: options,
      condition: condition ? this.options.find(r => r.value === condition) : null,
      value,
      value2,
      selectOptions: [],
      selectIsLoading: false
    };
    if (['G_name', 'Ph_Name'].indexOf(key) > -1 && condition === 'eq') {
      this.search(value);
    }
  }

  search = (str) => {
    str = str || '';
    if (!str.length) {
      return false;
    }
    const key = this.props.value.key;
    this.props.ReferenceStore.list(key, [{key, condition: 'cn', value: str}])
      .then(selectOptions => this.setState({selectOptions}))
      .then(() => this.setState({selectIsLoading: false}));
  };

  handleSelectChange = (v) => {
    let obj = {value: v.label, valueID: v.value};
    this.setState(obj);
    this.props.onChange(obj);
  };

  handleMultiSelectChange = (v) => {
    let obj = {value: v.map(item => item.label), valueID: v.map(item => item.value)};
    this.setState(obj);
    this.props.onChange(obj);
  };

  handleConditionChange = (v) => {
    let stateChangeObj = {condition: v};
    if (['nl', 'nnl'].indexOf(v.value) > -1) {
      stateChangeObj.value = '';
    } else if (["ls", "nls"].indexOf(v.value) > -1) {
      if (["ls", "nls"].indexOf(this.state.condition.value) === -1 && this.state.value) {
        stateChangeObj.value = [this.state.value];
        if (this.state.valueID) {
          stateChangeObj.valueID = [this.state.valueID];
        }
      }
    } else if (["ls", "nls"].indexOf(this.state.condition.value) > -1) {
      if (this.state.value && this.state.value.length) {
        stateChangeObj.value = this.state.value[0];
        if (this.state.valueID && this.state.valueID.length) {
          stateChangeObj.valueID = this.state.valueID[0];
        }
      }
    }
    this.setState({...stateChangeObj});
    this.props.onChange({...stateChangeObj, condition: v.value});
  };

  handleSelectInputChange = (str, { action }) => {
    if (action === 'menu-close' || action === 'input-blur' || action === 'set-value') { return }
    let stateOpts = {
      value: str
    };
    if (str.length) {
      stateOpts.selectIsLoading = true;
    }
    this.setState(stateOpts, () => {
      if (['G_name', 'Ph_Name'].indexOf(this.props.value.key) > -1) {
        this.search(str);
      }
    });
  };

  handleInputChange = (e) => {
    const {name, value} = e.target;
    this.setState({[name]: value});
    this.props.onChange({[name]: value});
  };

  handleDate1Change = (isMulti, value) => {
    value = value.add(offset, 'minutes');
    if (isMulti) {
      let array = this.state.value || [];
      value = array.concat([value]);
    }
    this.setState({value: value});
    this.props.onChange({value: value});
  };

  handleDate2Change = (isMulti, value) => {
    value = value.add(offset, 'minutes');
    if (isMulti) {
      let array = this.state.value2 || [];
      value = array.concat([value]);
    }
    this.setState({value2: value});
    this.props.onChange({value2: value});
  };

  onDelete = () => {
    this.props.onDelete(this.props.value, this.props.index);
  };

  onCreateOpenMenu = (v) => {
    return `Создать: ${v}`;
  };

  openDatePicker1 = () => {
    this.input1.setOpen(true);
  };

  openDatePicker2 = () => {
    this.input2.setOpen(true);
  };

  onRemoveDate = (index) => {
    let array = this.state.value || [];
    array.splice(index, 1);
    this.setState({value: array});
    this.props.onChange({value: array});
  };

  getInput = (key) => {
    return (
      <div className="condition__input">
        <input className="form-control" placeholder={this.placeholder}
               value={this.state[key] || ''}
               name={key} onChange={this.handleInputChange}/>
      </div>
    )
  };

  getDatePicker = (key, isMulti) => {
    let opts = {
      selectsStart: true,
      selectsEnd: false,
      value: this.state.value,
      onChange: this.handleDate1Change,
      onIconClick: this.openDatePicker1
    };
    if (key === 'input2') {
      opts.selectsStart = false;
      opts.selectsEnd = true;
      opts.value = this.state.value2;
      opts.onChange = this.handleDate2Change;
      opts.onIconClick = this.openDatePicker2;
    }
    opts.onChange = opts.onChange.bind(this, isMulti);
    const pickerAttrs = {
      ref: (c) => this[key] = c,
      dateFormat: datepickerFormat,
      className: "form-control",
      placeholderText: this.placeholder,
      popperContainer: CalendarContainer,
      onChange: opts.onChange
    };
    if (!isMulti) {
      pickerAttrs.selected = opts.value ? moment(opts.value) : null;
    }
    if (['btw'].indexOf(this.state.condition.value) > -1) {
      pickerAttrs.selectsStart = opts.selectsStart;
      pickerAttrs.selectsEnd = opts.selectsEnd;
      pickerAttrs.startDate = this.state.value;
      pickerAttrs.endDate = this.state.value2;
    }
    return (
      <div className="condition__input-container">
        {isMulti && opts.value && opts.value.length ? (
          <div className="creatable-items">
            {Array.isArray(opts.value) ? opts.value.map((v, i) => <CreatableItem key={i} item={v} index={i} onRemove={this.onRemoveDate}/>) : null}
          </div>
        ) : null}
        <InputGroup className="condition__input">
          <InputGroup.Prepend>
            <InputGroup.Text id={key} onClick={opts.onIconClick}><FontAwesomeIcon icon={faCalendarAlt}  /></InputGroup.Text>
          </InputGroup.Prepend>
          <DatePicker {...pickerAttrs}/>
        </InputGroup>
      </div>
    );
  };

  render() {
    const {value, value2, conditionOptions, condition, selectIsLoading, selectOptions, valueID} = this.state;
    const {title, type, key} = this.props.value;
    let input1 = null;
    let input2 = null;
    if (condition) {
      if (['ls', 'nls'].indexOf(condition.value) > -1) {
        if (type === 'date') {
          input1 = this.getDatePicker('input1', true);
        } else {
          input1 = (
            <CreatableSelect
              className="condition__input react-select"
              placeholder={this.placeholder}
              loadingMessage={() => ''}
              isLoading={selectIsLoading}
              noOptionsMessage={() => ''}
              menuPosition="fixed"
              classNamePrefix="react-select"
              menuShouldBlockScroll
              allowCreateWhileLoading
              formatCreateLabel={this.onCreateOpenMenu}
              defaultValue={value && Array.isArray(value) ? value.map((v, i) => ({label: v, value: valueID || i})) : []}
              isMulti
              onInputChange={this.handleSelectInputChange}
              onChange={this.handleMultiSelectChange}
              options={selectOptions}/>
          );
        }
      } else if (['nl', 'nnl'].indexOf(condition.value) === -1) {
        if (type === 'date') {
          input1 = this.getDatePicker('input1');
        } else if (['G_name', 'Ph_Name'].indexOf(key) > -1 && ['eq', 'neq'].indexOf(condition.value) > -1) {
          input1 = (
            <Select
              className="condition__input react-select"
              placeholder={this.placeholder}
              loadingMessage={() => ''}
              isLoading={selectIsLoading}
              noOptionsMessage={() => value && value.length ? 'Ничего не найдено' : ''}
              menuPosition="fixed"
              classNamePrefix="react-select"
              menuShouldBlockScroll
              inputValue={value}
              onInputChange={this.handleSelectInputChange}
              onChange={this.handleSelectChange}
              options={selectOptions} />
          );
        } else {
          input1 = this.getInput('value');
        }
        if (['btw'].indexOf(condition.value) > -1) {
          if (type === 'date') {
            input2 = this.getDatePicker('input2');
          } else {
            input2 = this.getInput('value2');
          }
        }
      }
    }
    return (
      <div className="condition">
        <div className="close" onClick={this.onDelete}>×</div>
        <div className="condition__header">
          <div className="condition__name">{title}</div>
          <div className="condition__select">
            <Select
              className="react-select"
              placeholder="Условие"
              isSearchable={false}
              menuPosition="fixed"
              classNamePrefix="react-select"
              menuShouldBlockScroll
              value={condition}
              onChange={this.handleConditionChange}
              options={conditionOptions}
            />
          </div>
        </div>
        <div className="condition__body">
          { input1 }
          { input2 }
        </div>
      </div>
    )
  }
}

export class Filter extends Component {

  onDelete = (item, index) => {
    const splitted = this.splitArray();
    if (item.common === 'or') {
      index += splitted.and.length;
    }
    this.props.to.splice(index, 1);
    this.props.onChange(this.props.to);
  };

  onDragEnd = result => {
    let { to } = this.props;

    // dropped outside the list
    if (!result.destination) {
      return;
    }

    let item = this.props.from.find(row => row.id === result.draggableId);
    const splitted = this.splitArray();
    if (result.source.droppableId === 'or') {
      result.source.index += splitted.and.length;
    }
    if (result.destination.droppableId === 'or') {
      result.destination.index += splitted.and.length;
    }
    if (item) {
      const clone = toJS(item);
      clone.id = uuid();
      clone.condition = "eq";
      clone.common = result.destination.droppableId;
      to.splice(result.destination.index, 0, clone);
      to = _.orderBy(to, v => {
        return !v.common || v.common === 'and';
      }, 'desc');
      this.props.onChange(to);
    } else {
      item = to.find(row => row.id === result.draggableId);
      if (item) {
        if (result.destination.droppableId === result.source.droppableId) {
          const [removed] = to.splice(result.source.index, 1);
          to.splice(result.destination.index, 0, removed);
          this.props.onChange(to);
        } else {
          const [removed] = to.splice(result.source.index, 1);
          removed.common = result.destination.droppableId;
          to.splice(result.destination.droppableId === 'or' ? result.destination.index - 1 : result.destination.index, 0, removed);
          this.props.onChange(to);
        }
      }
    }

  };

  splitArray = () => {
    const obj = {
      and: [],
      or: []
    };
    this.props.to.forEach(v => {
      if (v.common === 'or') {
        obj.or.push(v);
      } else {
        obj.and.push(v);
      }
    });
    return obj;
  };

  render() {
    const splitted = this.splitArray();

    return (
      <ErrorBoundary>
        <DragDropContext onDragEnd={this.onDragEnd}>
          <Droppable droppableId="droppable1" direction="horizontal" isDropDisabled>
            {(provided, snapshot) => (
              <div className="report-draggable-container"
                   ref={provided.innerRef}
                   {...provided.droppableProps}
              >
                {this.props.from.map((item, index) => (
                  <Draggable
                    key={item.id}
                    draggableId={item.id}
                    index={index}>
                    {(provided, snapshot) => (
                      <React.Fragment>
                        <div className="item original"
                             ref={provided.innerRef}
                             {...provided.draggableProps}
                             {...provided.dragHandleProps}
                             style={getFieldItemStyle(
                               snapshot.isDragging,
                               provided.draggableProps.style
                             )}
                        >
                          {item.title}
                        </div>
                        {snapshot.isDragging && (
                          <div className="item clone">{item.title}</div>
                        )}
                      </React.Fragment>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          <div style={{display: 'flex', flex: 1}}>
            <Card className="report-droppable-container-wrapper and">
              <Card.Header>Условие: <strong>И</strong></Card.Header>
              <Card.Body>
                <Droppable droppableId="and">
                  {(provided, snapshot) => (
                    <div className="report-droppable-container"
                         ref={provided.innerRef}
                         style={getSelectedListStyle(snapshot.isDraggingOver)}
                         {...provided.droppableProps}
                    >
                      { !splitted.and.length && !snapshot.isDraggingOver ? <div className="placeholder">Перетащите сюда критерии из верхнего списка</div> : null }
                      { splitted.and.map((item, index) => (
                        <Draggable
                          key={item.id}
                          draggableId={item.id}
                          index={index}>
                          {(provided, snapshot) => (
                            <div className="item"
                                 ref={provided.innerRef}
                                 {...provided.draggableProps}
                                 {...provided.dragHandleProps}
                            >
                              <FilterItem condition="and" value={item} index={index} onChange={(v) => Object.assign(item, v)} onDelete={this.onDelete}/>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </Card.Body>
            </Card>
            <Card className="report-droppable-container-wrapper">
              <Card.Header>Условие: <strong>ИЛИ</strong></Card.Header>
              <Card.Body>
                <Droppable droppableId="or">
                  {(provided, snapshot) => (
                    <div className="report-droppable-container"
                         ref={provided.innerRef}
                         style={getSelectedListStyle(snapshot.isDraggingOver)}
                         {...provided.droppableProps}
                    >
                      { !splitted.or.length && !snapshot.isDraggingOver ? <div className="placeholder">Перетащите сюда критерии из верхнего списка</div> : null }
                      { splitted.or.map((item, index) => (
                        <Draggable
                          key={item.id}
                          draggableId={item.id}
                          index={index}>
                          {(provided, snapshot) => (
                            <div className="item"
                                 ref={provided.innerRef}
                                 {...provided.draggableProps}
                                 {...provided.dragHandleProps}
                            >
                              <FilterItem condition="or" value={item} index={index} onChange={(v) => Object.assign(item, v)} onDelete={this.onDelete}/>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </Card.Body>
            </Card>
          </div>
        </DragDropContext>
      </ErrorBoundary>
    );
  }
}