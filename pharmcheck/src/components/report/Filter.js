import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import Select from 'react-select';
import uuid from 'uuid/v4';
import {InputGroup} from 'react-bootstrap';
import DatePicker from "react-datepicker";
import ErrorBoundary from '@components/common/ErrorBoundary';
import {toJS} from 'mobx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt } from '@fortawesome/free-regular-svg-icons';
import { Portal } from 'react-overlays';
import AsyncSelect from 'react-select/lib/Async';
import * as moment from 'moment';
const offset = moment().utcOffset();
import { observer, inject } from 'mobx-react';


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
      options = this.options.slice(0, 6);
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

  handleSelectChange = (key, v) => {
    if (key === 'condition') {
      this.setState({[key]: v});
      this.props.onChange({[key]: v.value});
    } else {
      let obj = {[key]: v.label, valueID: v.value};
      this.setState(obj);
      this.props.onChange(obj);
    }
  };

  handleSelectInputChange = (str, { action }) => {
    if (action === 'menu-close' || action === 'input-blur' || action === 'set-value') { return }
    let stateOpts = {
      value: str
    };
    if (str.length) {
      stateOpts.selectIsLoading = true;
    }
    this.setState(stateOpts, () => this.search(str));
  };

  handleInputChange = (e) => {
    const {name, value} = e.target;
    this.setState({[name]: value});
    this.props.onChange({[name]: value});
  };

  handleDateChange = (key, value) => {
    value = value.add(offset, 'minutes');
    this.setState({[key]: value});
    this.props.onChange({[key]: value});
  };

  render() {
    const {value, value2, conditionOptions, condition, selectIsLoading, selectOptions} = this.state;
    const {index, onDelete} = this.props;
    const {name, type, key} = this.props.value;
    let input1 = null;
    let input2 = null;
    if (condition) {
      if (['nl', 'nnl'].indexOf(condition.value) === -1) {
        if (type === 'date') {
          const pickerAttrs = {
            ref: (c) => this.input1 = c,
            selected: value ? moment(value) : null,
            dateFormat: "MM.DD.YYYY",
            className: "form-control",
            placeholderText: this.placeholder,
            popperContainer: CalendarContainer,
            onChange: this.handleDateChange.bind(this, 'value')
          };
          if (['btw'].indexOf(condition.value) > -1) {
            pickerAttrs.selectsStart = true;
            pickerAttrs.startDate = value;
            pickerAttrs.endDate = value2;
          }
          input1 = (
            <InputGroup className="condition__input">
              <InputGroup.Prepend>
                <InputGroup.Text id="input1" onClick={() => this.input1.setOpen(true)}><FontAwesomeIcon icon={faCalendarAlt}  /></InputGroup.Text>
              </InputGroup.Prepend>
              <DatePicker {...pickerAttrs}/>
            </InputGroup>
          );
        } else if (['G_name', 'Ph_Name'].indexOf(key) > -1 && condition.value === 'eq') {
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
              onChange={this.handleSelectChange.bind(this, 'value')}
              options={selectOptions} />
          );
        } else {
          input1 = (
            <div className="condition__input">
              <input className="form-control" placeholder={this.placeholder}
                     value={value || ''}
                     name="value" onChange={this.handleInputChange}/>
            </div>
          );
        }
      }
      if (['btw'].indexOf(condition.value) > -1) {
        if (type === 'date') {
          input2 = (
            <InputGroup className="condition__input">
              <InputGroup.Prepend>
                <InputGroup.Text id="input1" onClick={() => this.input2.setOpen(true)}><FontAwesomeIcon icon={faCalendarAlt}  /></InputGroup.Text>
              </InputGroup.Prepend>
              <DatePicker
                ref={(c) => this.input2 = c}
                selected={value2 ? moment(value2) : null}
                dateFormat="MM.DD.YYYY"
                className="form-control"
                placeholderText={this.placeholder}
                popperContainer={CalendarContainer}
                selectsEnd
                startDate={value}
                endDate={value2}
                onChange={this.handleDateChange.bind(this, 'value2')}
              />
            </InputGroup>
          );
        } else {
          input2 = (
            <div className="condition__input">
              <input className="form-control" placeholder="Введите значение для сравнения"
                     value={value2 || ''}
                     name="value2" onChange={this.handleInputChange}/>
            </div>
          );
        }
      }
    }
    return (
      <div className="condition">
        <div className="close" onClick={onDelete.bind(null, this.props.value, index)}>×</div>
        <div className="condition__header">
          <div className="condition__name">{name}</div>
          <div className="condition__select">
            <Select
              placeholder="Условие"
              isSearchable={false}
              menuPosition="fixed"
              value={condition}
              onChange={this.handleSelectChange.bind(this, 'condition')}
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
    const { to, onChange } = this.props;
    to.splice(index, 1);
    onChange(to);
  };

  componentWillReceiveProps(props) {
    // console.log(props);
  }

  onDragEnd = result => {
    const { to, from, onChange } = this.props;
    const { source, destination, draggableId } = result;

    // dropped outside the list
    if (!destination) {
      return;
    }

    let item = from.find(row => row.id === draggableId);
    if (item) {
      const clone = toJS(item);
      clone.id = uuid();
      clone.condition = "eq";
      to.splice(destination.index, 0, clone);
      onChange(to);
    } else {
      item = to.find(row => row.id === draggableId);
      if (item) {
        const [removed] = to.splice(result.source.index, 1);
        to.splice(result.destination.index, 0, removed);
        onChange(to);
      }
    }

  };

  render() {
    const { from, to, onChange } = this.props;

    return (
      <ErrorBoundary>
        <DragDropContext onDragEnd={this.onDragEnd}>
          <Droppable droppableId="droppable1" direction="horizontal" isDropDisabled>
            {(provided, snapshot) => (
              <div className="report-draggable-container"
                   ref={provided.innerRef}
                   {...provided.droppableProps}
              >
                {from.map((item, index) => (
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
                          {item.name}
                        </div>
                        {snapshot.isDragging && (
                          <div className="item clone">{item.name}</div>
                        )}
                      </React.Fragment>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          <Droppable droppableId="droppable2" style={{minHeight: 100}}>
            {(provided, snapshot) => (
              <div className="report-droppable-container"
                   ref={provided.innerRef}
                   style={getSelectedListStyle(snapshot.isDraggingOver)}
                   {...provided.droppableProps}
              >
                { !to.length && !snapshot.isDraggingOver ? <div className="placeholder">Перетащите сюда критерии из верхнего списка</div> : null }
                { to.map((item, index) => (
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
                        <FilterItem value={item} index={index} onChange={(v) => Object.assign(item, v)} onDelete={this.onDelete}/>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </ErrorBoundary>
    );
  }
}