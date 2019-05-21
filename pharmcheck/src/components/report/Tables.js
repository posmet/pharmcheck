import React, { Component } from 'react';
import { toJS } from 'mobx';
import _ from 'lodash';
import uuid from 'uuid/v4';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import ErrorBoundary from '@components/common/ErrorBoundary';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleRight } from '@fortawesome/free-solid-svg-icons';
import { withStyles } from '@material-ui/core/styles';
import {Collapse, Button} from 'react-bootstrap';
import {
  GroupingState,
  IntegratedGrouping,
  TreeDataState,
  CustomTreeData,
  FilteringState,
  SortingState,
  IntegratedFiltering,
  IntegratedSorting,
  DataTypeProvider
} from '@devexpress/dx-react-grid';
import {
  Grid,
  Table,
  VirtualTable,
  TableHeaderRow,
  TableBandHeader,
  TableGroupRow,
  GroupingPanel,
  DragDropProvider,
  Toolbar,
  TableColumnReordering,
  TableColumnResizing,
  ColumnChooser,
  TableColumnVisibility,
  TableTreeColumn,
  TableFilterRow
} from '@devexpress/dx-react-grid-material-ui';
import { AutoSizer } from "react-virtualized";
import { Menu, Item, contextMenu } from 'react-contexify';
import classNames from 'classnames';

import Chart, {
  AdaptiveLayout,
  CommonSeriesSettings,
  Size,
  Tooltip,
} from 'devextreme-react/chart';
import PivotGridDataSource from 'devextreme/ui/pivot_grid/data_source';
import PivotGrid, {
  FieldChooser,
  FieldPanel,
  HeaderFilter
} from 'devextreme-react/pivot-grid';
import CustomStore from "devextreme/data/custom_store";

const summaryKey = 'frontSummary';
const rowsTitleKey = 'frontRowsTitle';
const separator = '#_#';
const bandedColumnWidth = 130;

const FilterIcon = ({ type, ...restProps }) => {
  // if (type === 'month') return <DateRange {...restProps} />;
  return <TableFilterRow.Icon type={type} {...restProps} />;
};

const getFieldItemStyle = (isDragging, draggableStyle, snapshot) => {
  if (!snapshot.isDropAnimating) {
    return draggableStyle;
  }
  return {
    ...draggableStyle,
    // cannot be 0, but make it super tiny
    transform: "none!important",
    transitionDuration: `0.001s`,
  };
};

const getSelectedListStyle = isDraggingOver => ({
  background: isDraggingOver ? 'lightblue' : 'transparent',
});

const styles = theme => ({
  tableStriped: {
    /*'& thead tr th': {
      borderRight: '1px solid #ddd',
      borderTop: '1px solid #ddd',
      background: '#f9f9f9',
    },
    '& thead tr th:nth-of-type(1)': {
      borderLeft: '1px solid #ddd',
    },
    '& tbody tr td': {
      borderRight: '1px solid #ddd',
    },
    '& tbody tr td:nth-of-type(1)': {
      borderLeft: '1px solid #ddd',
    },*/
  },
});

const cellStyles = theme => ({
  icon: {
    marginBottom: theme.spacing.unit / 2,
    marginLeft: theme.spacing.unit,
    verticalAlign: 'middle',
  },
});

const TableComponentBase = ({ classes, ...restProps }) => (
  <Table.Table
    {...restProps}
    className={classes.tableStriped}
  />
);

const HeaderCellComponentBase = ({ classes, ...restProps }) => {
  return (
    <TableHeaderRow.Cell
    {...restProps}
    className="test"
    title={restProps.column.title}
    />
  );
};

const BandCellBase = ({children, tableRow, tableColumn, column, classes, ...restProps}) => {
  const replaced = children.replace(new RegExp(`${separator}\\S+${separator}`), '');
  return (
    <TableBandHeader.Cell
      {...restProps}
      column={column}
      title={replaced}
    >
      <strong title={replaced}>
        {replaced}
      </strong>
    </TableBandHeader.Cell>
  );
};

const tableMessages = {
  noData: '',
};

const filterAllFields = {
  contains: 'Содержит',
  notContains: 'Не содержит',
  equal: 'Равно',
  notEqual: 'Не равно'
};

const filterNumberFields = {
  ...filterAllFields,
  greaterThan: 'Больше',
  greaterThanOrEqual: 'Больше или равно',
  lessThan: 'Меньше',
  lessThanOrEqual: 'Меньше или равно',
};

const filterMessages = {
  ...filterAllFields,
  ...filterNumberFields,
  filterPlaceholder: 'Фильтр'
};

const headerMessages = {
  sortingHint: 'Сортировать. Для отмены сортировки зажмите клавишу ctrl'
};

const valuesMap = {
  count: {
    short: 'count',
    full: 'Кол-во(count)'
  },
  min: {
    short: 'min',
    full: 'Минимальное значение(min)'
  },
  max: {
    short: 'max',
    full: 'Максимальное значение(max)'
  },
  sum: {
    short: 'Σ',
    full: 'Сумма(Σ)'
  },
  avg: {
    short: 'avg',
    full: 'Среднее(avg)'
  }
};

class ExtendedDroppableColumn extends React.PureComponent {
  map = {
    fields: {
      droppableId: 'fields',
      isDropDisabled: true,
      title: 'Поля таблицы'
    },
    rows: {
      droppableId: 'rows',
      isDropDisabled: false,
      title: 'Строки'
    },
    columns: {
      droppableId: 'columns',
      isDropDisabled: false,
      title: 'Колонки'
    },
    values: {
      droppableId: 'values',
      isDropDisabled: false,
      title: 'Значения',
      itemPrefix: ' по полю: '
    }
  };
  onShowMenu = (item, index, e) => {
    e.preventDefault();
    if (this.props.name !== 'values') {
      return false;
    }
    contextMenu.show({
      id: this.props.name,
      event: e,
      props: {item, index}
    });
  };
  onChangeMenu = (value, {props}) => {
    this.props.onValueChange(value, props);
  };
  render() {
    const { name, items } = this.props;
    const map = this.map[name];
    return (
      <Droppable droppableId={map.droppableId} direction={map.isDropDisabled ? 'horizontal' : 'vertical'} isDropDisabled={map.isDropDisabled}>
        {(provided, snapshot) => (
          <div className="extended-table__header_column"
               ref={provided.innerRef}
               style={getSelectedListStyle(snapshot.isDraggingOver && !map.isDropDisabled)}
               {...provided.droppableProps}
          >
            <div className="extended-table__header_column-title">{map.title}:</div>
            <div className="extended-table__header_column-items" style={{flexDirection: map.isDropDisabled ? 'row' : 'column', minHeight: map.isDropDisabled ? 0 : 100, flexWrap: map.isDropDisabled ? 'wrap' : 'nowrap'}}>
              { !items.length && !map.isDropDisabled ? <div className="placeholder">Перетащите сюда поле таблицы</div> : null }
              {items.map((item, index) => (
                <Draggable
                  key={item.id}
                  draggableId={item.id}
                  index={index}>
                  {(provided, snapshot) => (
                    <React.Fragment>
                      <div onClick={this.onShowMenu.bind(this, item, index)} title={`${map.itemPrefix ? `${valuesMap[item.value || 'count'].full}${map.itemPrefix}` : ''}${item.title}`} className={`extended-table__header_column-item original ${item.selected ? 'active' : ''}`}
                           ref={provided.innerRef}
                           {...provided.draggableProps}
                           {...provided.dragHandleProps}
                           style={getFieldItemStyle(
                             snapshot.isDragging,
                             provided.draggableProps.style,
                             snapshot
                           )}
                      >
                        {map.itemPrefix ? `${valuesMap[item.value || 'count'].full}${map.itemPrefix}` : ''}{item.title}
                        {!map.isDropDisabled ? <span className="close" onClick={this.props.onDelete.bind(this, index)}>×</span> : null}
                      </div>
                      {snapshot.isDragging && map.isDropDisabled && (
                        <div className="extended-table__header_column-item active clone">{map.itemPrefix ? `${valuesMap[item.value || 'count'].full}${map.itemPrefix}` : ''}{item.title}</div>
                      )}
                    </React.Fragment>
                  )}
                </Draggable>
              ))}
            </div>
            <Menu id={name}>
              {Object.keys(valuesMap).map(key => <Item key={key} onClick={this.onChangeMenu.bind(this, key)}>{valuesMap[key].full}</Item>)}
            </Menu>
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    );
  }
}

const TableComponent = withStyles(styles, { name: 'TableComponent' })(TableComponentBase);
const HeaderCellComponent = withStyles(styles, { name: 'HeaderCellComponent' })(HeaderCellComponentBase);
const BandCell = withStyles(cellStyles, { name: 'BandCell' })(BandCellBase);

const getSum = (array, key) => {
  return array.reduce((sum, v) => {
    let floatValue = parseFloat(v[key]);
    return isNaN(v[key]) || isNaN(floatValue) ? sum : sum + floatValue;
  }, 0);
};

export class ExtendedTable extends React.Component {
  constructor(props) {
    super();
    this.setRefChart = this.setRef.bind(this, '_chart');
    this.setRefPivot = this.setRef.bind(this, '_pivot');
    let fields = [];
    if (props.extended && props.extended.fields) {
      fields = props.extended.fields;
    } else {
      props.columns.forEach(v => {
        const title = v.title;
        fields.push({name: title, caption: title, dataField: v.key, displayFolder: title, allowSorting: true, isMeasure: false});
        fields.push({name: `${title} (сум)`, caption: `${title} (сум)`, dataField: v.key, displayFolder: title, summaryType: 'sum', allowFiltering: true, allowSorting: true, isMeasure: true});
        fields.push({name: `${title} (кол-во)`, caption: `${title} (кол-во)`, dataField: v.key, displayFolder: title, summaryType: 'count', allowFiltering: true, allowSorting: true, isMeasure: true});
        fields.push({name: `${title} (ср)`, caption: `${title} (ср)`, dataField: v.key, displayFolder: title, summaryType: 'avg', allowFiltering: true, allowSorting: true, isMeasure: true});
        fields.push({name: `${title} (мин)`, caption: `${title} (мин)`, dataField: v.key, displayFolder: title, summaryType: 'min', allowFiltering: true, allowSorting: true, isMeasure: true});
        fields.push({name: `${title} (макс)`, caption: `${title} (макс)`, dataField: v.key, displayFolder: title, summaryType: 'max', allowFiltering: true, allowSorting: true, isMeasure: true});
      });
      // fields = props.columns.map(v => ({caption: v.title, dataField: v.key}));
    }
    this.state = {
      dataSource: new PivotGridDataSource({
        fields,
        onChanged: () => {
          if (this._pivot) {
            this.props.extended.fields = this._pivot.getDataSource().fields();
          }
        },
        store: new CustomStore({
          key: "id",
          load: (loadOptions) => {
            return new Promise((resolve) => {
              return resolve(this.props.rows || []);
            })
          }
        })
      })
    };
  }
  componentDidMount() {
    this._pivot.bindChart(this._chart, {
      dataFieldsDisplayMode: 'splitPanes',
      alternateDataFields: false
    });
  }
  componentWillReceiveProps(props) {
    this.state.dataSource && this.state.dataSource.reload();
    this._pivot.getDataSource().fields(this.props.extended.fields);
  }
  setRef = (key, el) => {
    if (el && el.instance) {
      this[key] = el.instance;
    }
  };
  render() {
    return (
      <React.Fragment>
        <Chart
          ref={this.setRefChart}>
          <Size height={200} />
          {/*<Tooltip enabled={true} />*/}
          <CommonSeriesSettings type={'bar'} />
          <AdaptiveLayout width={450} />
        </Chart>

        <PivotGrid
          dataSource={this.state.dataSource}
          allowSortingBySummary={false}
          allowFiltering={true}
          showBorders={true}
          showColumnTotals={true}
          showColumnGrandTotals={true}
          showRowTotals={false}
          showRowGrandTotals={false}
          texts={{
            noData: "",
            showFieldChooser: "Показать настройки таблицы",
            grandTotal: 'Итого'
          }}
          ref={this.setRefPivot}
        >
          <FieldChooser
            enabled={true}
            height={500}
            title="Настройки таблицы"
            texts={{
              allFields: 'Все поля',
              columnFields: 'Колонки',
              dataFields: 'Значения',
              rowFields: 'Строки',
              filterFields: 'Фильтр'
            }}
          />
          <HeaderFilter
            texts={{
              cancel: 'Отмена',
              ok: 'Применить',
              emptyValue: 'Пусто'
            }}
          />
          {/*<FieldPanel visible={true} />*/}
        </PivotGrid>
      </React.Fragment>
    )
  }
}

export class ExtendedTable1 extends React.PureComponent {

  state = {
    expandedRowIds: [],
    showSettings: false
  };

  onDragEnd = result => {
    const { onChange } = this.props;
    const { source, destination, draggableId } = result;

    if (source.droppableId === 'fields') {
      if (!destination) {
        return false;
      }
      let item = this.props.columns.find(row => row.id === draggableId);
      if (item.selected) { //поле уже используется
        if (this.props.extended[destination.droppableId].find(row => row.name === item.name)) { //в разделе уже есть такое поле
          return false;
        }
        //удаляем из остальных разделов
        ['columns', 'rows', 'values'].filter(v => v !== destination.droppableId).forEach(key => {
          if (this.props.extended[key].find(v => v.name === item.name)) {
            this.props.extended[key] = this.props.extended[key].filter(v => v.name !== item.name);
          }
        });
      }
      const clone = toJS(item);
      clone.id = uuid();
      clone.selected = false;
      item.selected = true;
      const array = this.props.extended[destination.droppableId];
      this.props.extended.actions = [];
      array.splice(destination.index, 0, clone);
      onChange(this.props.extended, this.props.columns);
    } else {
      if (!destination) { //удаляем
        const [removed] = this.props.extended[source.droppableId].splice(result.source.index, 1);
        let item = this.props.columns.find(row => row.name === removed.name);
        item.selected = false;
        this.props.extended.actions = [];
        onChange(this.props.extended, this.props.columns);
        return false;
      }
      //перемещаем/меняем позицию
      const [removed] = this.props.extended[source.droppableId].splice(result.source.index, 1);
      this.props.extended[destination.droppableId].splice(destination.index, 0, removed);
      this.props.extended.actions = [];
      onChange(this.props.extended);
    }

  };

  onDelete = (key, index, e) => {
    e.preventDefault();
    e.stopPropagation();
    const [removed] = this.props.extended[key].splice(index, 1);
    let item = this.props.columns.find(row => row.name === removed.name);
    item.selected = false;
    this.props.onChange(this.props.extended, this.props.columns);
  };

  onValueChange = (value, props) => {
    const item = this.props.extended.values[props.index];
    if (item.value === value) {
      return false;
    }
    item.value = value;
    this.props.onChange(this.props.extended);
  };

  getSavedWidth = (name, width) => {
    const actionsFiltered = this.props.extended.actions.filter(v => v.columnName === name && v.width);
    const defaultWidth = width || bandedColumnWidth;
    return actionsFiltered.length ? actionsFiltered[0].width : defaultWidth;
  };

  getBandedTree = (index, node, tableColumns) => {
    const { columns, values } = this.props.extended;
    if (columns.length < index + 1) {
      return false;
    }
    if (!node.columnName) {
      node.columnName = columns[index].name;
    }
    let parentColumnName = '';
    if (!index && !node.isLabel) {
      node.title = columns[index].title;
      node.isParent = true;
    } else {
      parentColumnName = `${node.columnName}${separator}`;
    }
    const isLast = columns.length < index + 2;
    let filteredRows = this.props.rows;
    if (node.grouping) {
      node.grouping.forEach(group => {
        filteredRows = filteredRows.filter(v => v[group.name] == group.value);
      });
    }
    let groupedRows = _.groupBy(filteredRows, columns[index].name);
    node.children = [];
    _.keys(groupedRows).forEach((v, i) => {
      let name = `${parentColumnName}${columns[index].name}${separator}${v}`;
      let obj = {
        columnName: name,
        titleClean: v,
        title: `${v}${!node.isParent ? `${separator}${node.title}${separator}` : ''}`,
        grouping: node.grouping ? node.grouping.concat([{name: columns[index].name, value: v}]) : [{name: columns[index].name, value: v}],
      };
      if (values.length > 1 && isLast) {
        if (!node.isLabel) {
          node.children.push({title: v, isLabel: true, columnName: name, grouping: obj.grouping, children: []});
        } else if (v === node.title){
          name = `${parentColumnName}${columns[index].name}`;
          values.forEach(vv => {
            node.children.push({
              columnName: `${name}${vv.name}`,
              grouping: obj.grouping,
              name: `${name}${vv.name}`,
              title: isLast ? `${v} - ${valuesMap[vv.value || 'count'].short}: ${vv.title}` : v
            });
            tableColumns.push({
              ...obj,
              width: this.getSavedWidth(`${name}${vv.name}`),
              name: `${name}${vv.name}`,
              nameClean: vv.name,
              title: `${v} - ${valuesMap[vv.value || 'count'].short}: ${vv.title}`,
              valueProps: {name: vv.name, value: vv.value},
              isValue: true
            });
          });
        }
      } else {
        node.children.push({...obj});
        if (isLast) {
          tableColumns.push({
            ...obj,
            width: this.getSavedWidth(name),
            name,
            nameClean: columns[index].name,
            title: v,
            valueProps: values.length ? {name: values[0].name, value: values[0].value} : undefined
          });
        }
      }
    });
    node.width = node.children.length * 100 || 100;
    node.children.forEach(v => {
      if (!v.isValue) {
        this.getBandedTree(!v.isLabel ? index + 1 : index, v, tableColumns);
      }
    });
    if (values.length > 0 && !node.isLabel) {
      node.children = node.children.concat(values.map(v => ({
        isValue: true,
        columnName: `${parentColumnName}${v.name}`,
        title: `${node.titleClean || node.title} - ${valuesMap[v.value || 'count'].short}: ${v.title}`,
        grouping: node.grouping,
      })));
      values.forEach(v => {
        const name = `${parentColumnName}${v.name}`;
        tableColumns.push({
          width: this.getSavedWidth(name),
          name,
          title: `${node.titleClean || node.title} - ${valuesMap[v.value || 'count'].short}: ${v.title}`,
          valueProps: {name: v.name, value: v.value},
          isValue: true,
          grouping: node.grouping,
        });
      });
    }
  };

  getBandedRowTree = (index, node, tableRows, tableColumns) => {
    const { rows } = this.props.extended;
    if (rows.length < index + 1) {
      return false;
    }
    if (!index) {
      node.title = rows[index].title;
      node.isParent = true;
      node.id = null;
    }
    let groupedRows = _.groupBy(!index ? this.props.rows : node.rows, rows[index].name);
    node.children = _.keys(groupedRows).map(v => {
      const id = tableRows.length;
      tableRows.push(this.fillRow(v, rows[index].name, node.id, id + 1, node.grouping ? node.grouping.concat([{name: rows[index].name, value: v}]) : [{name: rows[index].name, value: v}], tableColumns));
      return {
        grouping: node.grouping ? node.grouping.concat([{name: rows[index].name, value: v}]) : [{name: rows[index].name, value: v}],
        rows: groupedRows[v],
        title: v,
        name: rows[index].name,
        id: id + 1
      }
    });
    node.children.forEach(v => {
      this.getBandedRowTree(index + 1, v, tableRows, tableColumns);
    });
  };

  getChildRows = (row, rootRows) => {
    const childRows = rootRows.filter(r => r.parentId === (row ? row.id : null));
    return childRows.length ? childRows : null;
  };

  arrayToJS = (array) => {
    return array.map(v => toJS(v));
  };

  getRowAggregateValue = (rowName, rowValue, rowGrouping, columnName, columnValue, columnGrouping, valueProps) => {
    rowGrouping = rowGrouping || [];
    columnGrouping = columnGrouping || [];
    let result = this.props.rows;
    columnGrouping.forEach(group => {
      result = result.filter(v => v[group.name] == group.value);
    });
    rowGrouping.forEach(group => {
      result = result.filter(v => v[group.name] == group.value);
    });
    let totally = result.length;
    switch (valueProps.value) {
      case 'count':
        totally = result.length;
        break;
      case 'sum':
        totally = (getSum(result, valueProps.name)).toFixed(2);
        break;
      case 'avg':
        totally = result.length ? (getSum(result, valueProps.name)/result.length).toFixed(2) : totally;
        break;
      case 'min':
        let min = 0;
        if (result.length) {
          let floatValue = parseFloat(result[0][valueProps.name]);
          min = isNaN(result[0][valueProps.name]) || isNaN(floatValue) ? 0 : floatValue;
        }
        totally = result.reduce((sum, v) => {
          let floatValue = parseFloat(v[valueProps.name]);
          return floatValue < sum ? floatValue : sum;
        }, min);
        break;
      case 'max':
        totally = result.reduce((sum, v) => {
          let floatValue = parseFloat(v[valueProps.name]);
          return floatValue > sum ? floatValue : sum;
        }, 0);
        break;

    }
    return totally;
  };

  fillRow = (rowValue, rowName, parentId, id, rowGrouping, tableColumns) => {
    let obj = {[rowsTitleKey]: rowValue, parentId, id, grouping: rowGrouping};
    tableColumns.forEach(column => {
      if (column.name !== rowsTitleKey && column.valueProps) {
        let value = this.getRowAggregateValue(rowName, rowValue, rowGrouping, column.titleClean, column.nameClean, column.grouping, column.valueProps);
        obj[column.name] = value;
      }
    });
    return obj;
  };

  changeExpandedRowIds = (expandedRowIds) => {
    this.setState({ expandedRowIds });
  };

  onFilterChange = (filtered) => {
    const obj = _.keyBy(filtered, 'columnName');
    if (!this.props.extended.actions.length) {
      this.props.extended.actions = this.props.extended.actions.concat(filtered);
    } else {
      this.props.extended.actions = this.props.extended.actions.filter(v => {
        if (obj[v.columnName]) {
          _.merge(v, obj[v.columnName]);
          obj[v.columnName].used = true;
        }
        if (v.direction || v.width) {
          return true;
        }
        return Object.keys(obj).indexOf(v.columnName) > -1;
      });
      Object.keys(obj).forEach(v => {
        if (!obj[v].used) {
          this.props.extended.actions.push(obj[v]);
        }
      });
    }
    this.props.onChange(this.props.extended);
  };
  onSortingChange = (sorted) => {
    const obj = _.keyBy(sorted, 'columnName');
    if (!this.props.extended.actions.length) {
      this.props.extended.actions = this.props.extended.actions.concat(sorted);
    } else {
      this.props.extended.actions = this.props.extended.actions.filter(v => {
        if (obj[v.columnName]) {
          _.merge(v, obj[v.columnName]);
          obj[v.columnName].used = true;
        }
        if (v.value || v.width) {
          return true;
        }
        return Object.keys(obj).indexOf(v.columnName) > -1;
      });
      Object.keys(obj).forEach(v => {
        if (!obj[v].used) {
          this.props.extended.actions.push(obj[v]);
        }
      });
    }
    this.props.onChange(this.props.extended);
  };

  onResising = (changed) => {
    const filtered = changed.filter(v => v.width !== bandedColumnWidth);
    const obj = _.keyBy(filtered, 'columnName');
    if (!this.props.extended.actions.length) {
      this.props.extended.actions = this.props.extended.actions.concat(filtered);
    } else {
      this.props.extended.actions = this.props.extended.actions.filter(v => {
        if (obj[v.columnName]) {
          _.merge(v, obj[v.columnName]);
          obj[v.columnName].used = true;
        }
        if (v.value || v.direction) {
          return true;
        }
        return Object.keys(obj).indexOf(v.columnName) > -1;
      });
      Object.keys(obj).forEach(v => {
        if (!obj[v].used) {
          this.props.extended.actions.push(obj[v]);
        }
      });
    }
    this.props.onChange(this.props.extended);
  };

  toggleSettings = () => {
    this.setState({showSettings: !this.state.showSettings});
  };

  tableRoot = (props) => <Grid.Root {...props} className="material-table-bordered" style={{ height: "100%", maxHeight: this.props.rows.length ? 550 : 400 }}/>;

  get table() {
    const { columns, rows, values, actions } = this.props.extended;
    if (!rows.length && !columns.length && !values.length) {
      return null;
    }
    let banded = [];
    let tableColumns = [];
    let tableRows = [];

    if (columns.length) {
      let bandedObj = {};
      this.getBandedTree(0, bandedObj, tableColumns);
      banded = [bandedObj];
      // tableColumns = _.sortBy(tableColumns, 'name');
    } else if (values.length) {
      values.forEach(v => {
        tableColumns.push({
          width: this.getSavedWidth(v.name),
          name: `${v.name}`,
          title: `${valuesMap[v.value || 'count'].short}: ${v.title}`,
          isValue: true,
          valueProps: {name: v.name, value: v.value}
        });
      });
    }

    if (rows.length) {
      tableColumns.unshift({name: rowsTitleKey, title: 'Названия строк', type: 'string', width: this.getSavedWidth(rowsTitleKey, 230)});
      let bandedObj = {};
      this.getBandedRowTree(0, bandedObj, tableRows, tableColumns);
    } else if (tableColumns.length && values.length){
      tableRows = [this.fillRow(null, null, null, 1, [], tableColumns)];
    }

    return (
      <AutoSizer disableHeight>
        {({ height, width }) => {
          return (
            <div style={{height, width}}>
              <Grid
                rows={tableRows}
                columns={tableColumns}
                getRowId={getRowId}
                rootComponent={this.tableRoot}
              >
                <DataTypeProvider
                  for={tableColumns.filter(v => v.type !== 'string').map(v => v.name)}
                  availableFilterOperations={Object.keys(filterNumberFields)}
                />
                <DataTypeProvider
                  for={tableColumns.filter(v => v.type === 'string').map(v => v.name)}
                  availableFilterOperations={Object.keys(filterAllFields)}
                />
                <SortingState
                  sorting={actions.filter(v => v.direction)}
                  onSortingChange={this.onSortingChange}
                />
                <FilteringState
                  filters={actions.filter(v => v.value)}
                  onFiltersChange={this.onFilterChange}
                />
                <TreeDataState
                  defaultExpandedRowIds={tableRows.length ? [tableRows[0].id] : []}
                />
                <CustomTreeData
                  getChildRows={this.getChildRows}
                />
                <IntegratedSorting />
                <IntegratedFiltering/>
                <Table
                  height="auto"
                  tableComponent={TableComponent}
                  messages={tableMessages}
                />

                <TableColumnResizing
                  columnWidths={tableColumns.map(v => ({columnName: v.columnName || v.name, width: v.width || bandedColumnWidth}))}
                  onColumnWidthsChange={this.onResising}
                />

                <TableHeaderRow
                  showSortingControls
                  messages={headerMessages}
                  cellComponent={HeaderCellComponent}
                />

                <TableTreeColumn
                  for={rowsTitleKey}
                />

                <TableBandHeader
                  cellComponent={BandCell}
                  columnBands={banded}
                />

                <TableFilterRow
                  showFilterSelector
                  iconComponent={FilterIcon}
                  messages={filterMessages}
                />
              </Grid>
            </div>
          )
        }}
      </AutoSizer>
    )
  }

  render() {
    const { rows, columns, values } = this.props.extended;

    return (
      <div className="extended-table">
        <Button variant="link" onClick={this.toggleSettings}>
          <FontAwesomeIcon icon={faAngleRight} /> Настройки таблицы
        </Button>
        <Collapse in={this.state.showSettings}>
          <div>
            <ErrorBoundary>
              <div className="extended-table__header">
                <DragDropContext onDragEnd={this.onDragEnd}>
                  <ExtendedDroppableColumn name="fields" items={this.props.columns} />
                  <ExtendedDroppableColumn name="columns" items={columns} onDelete={this.onDelete.bind(this, 'columns')} />
                  <ExtendedDroppableColumn name="rows" items={rows} onDelete={this.onDelete.bind(this, 'rows')} />
                  <ExtendedDroppableColumn name="values" items={values} onDelete={this.onDelete.bind(this, 'values')} onValueChange={this.onValueChange} />
                </DragDropContext>
              </div>
            </ErrorBoundary>
          </div>
        </Collapse>
        <ErrorBoundary>
          <div className="extended-table__body">
            {this.table}
          </div>
        </ErrorBoundary>
      </div>
    );
  }
}

export class DefaultTable extends React.PureComponent {
  onHiddenChange = (v) => {
    const { columns, onChange } = this.props;
    if (v.length === columns.length) {
      return false;
    }
    columns.forEach(item => {
      item.hidden = v.indexOf(item.name) > -1;
    });
    onChange(columns);
  };
  onOrderChange = (ordered) => {
    const { columns, onChange } = this.props;
    const obj = _.keyBy(columns, 'name');
    onChange(ordered.map(v => obj[v]));
  };
  onGroupingChange = (v) => {
    const { columns, onChange } = this.props;
    const groupingMap = v.map(item => item.columnName);
    columns.forEach(item => {
      item.grouping = groupingMap.indexOf(item.name) > -1;
    });
    onChange(columns);
  };
  onFilterChange = (filtered) => {
    const { columns, onChange } = this.props;
    const obj = _.keyBy(filtered, 'columnName');
    columns.forEach(v => {
      v.filterValue = obj[v.name] ? obj[v.name].value : '';
      v.filterOperator = obj[v.name] ? obj[v.name].operation : 'contains';
    });
    onChange(columns);
  };
  onSortingChange = (sorted) => {
    const { columns, onChange } = this.props;
    const obj = _.keyBy(sorted, 'columnName');
    columns.forEach(v => {
      if (obj[v.name]) {
        v.sort =  obj[v.name].direction;
      } else {
        delete v.sort;
      }
    });
    onChange(columns);
  };
  onResising = (columnFlexWidth, changed) => {
    const { columns, onChange } = this.props;
    changed.forEach((v, i) => {
      // if (v.width !== columnFlexWidth) {
        columns[i].width = v.width;
      // }
    });
    onChange(columns);
  };
  tableRoot = (props) => <Grid.Root {...props} className="material-table-bordered" style={{ height: "100%", maxHeight: this.props.rows.length ? 550 : 400 }}/>;
  render() {
    const { rows, columns } = this.props;
    const fixedWidths = columns.filter(v => v.width >= 0);
    let fixedWidthsValue = fixedWidths.length ? fixedWidths.reduce((sum, next) => sum + next.width, 0) : 0;

    return (
      <ErrorBoundary>
        <AutoSizer disableHeight>
          {({ height, width }) => {
            const columnFlexWidth = (width - fixedWidthsValue)/(columns.length - fixedWidths.length);
            return (
              <div style={{height, width}}>
                <Grid
                  rows={rows}
                  columns={columns}
                  getRowId={getRowId}
                  rootComponent={this.tableRoot}
                >
                  <DataTypeProvider
                    for={columns.filter(v => v.type === 'number').map(v => v.name)}
                    availableFilterOperations={Object.keys(filterNumberFields)}
                  />
                  <DataTypeProvider
                    for={columns.filter(v => v.type !== 'number').map(v => v.name)}
                    availableFilterOperations={Object.keys(filterAllFields)}
                  />
                  <DragDropProvider/>
                  <SortingState
                    sorting={columns.filter(v => v.sort).map(v => ({columnName: v.name, direction: v.sort}))}
                    onSortingChange={this.onSortingChange}
                  />
                  <GroupingState
                    grouping={columns.filter(v => v.grouping).map(v => ({columnName: v.name}))}
                    onGroupingChange={this.onGroupingChange}
                  />
                  <FilteringState
                    filters={columns.filter(v => v.filterValue).map(v => ({ columnName: v.name, value: v.filterValue, operation: v.filterOperator}))}
                    onFiltersChange={this.onFilterChange}
                  />
                  <IntegratedSorting />
                  <IntegratedGrouping/>
                  <IntegratedFiltering/>
                  <VirtualTable
                    height="auto"
                    tableComponent={TableComponent}
                    messages={tableMessages}
                  />
                  <TableGroupRow/>
                  <Toolbar/>
                  <GroupingPanel
                    showGroupingControls
                    showSortingControls
                    messages={{groupByColumn: 'Перетащите сюда колонку для группировки'}}
                  />
                  <TableColumnReordering
                    order={columns.map(v => v.name)}
                    onOrderChange={this.onOrderChange}
                  />
                  <TableColumnResizing
                    columnWidths={columns.map(v => ({columnName: v.name, width: v.width || columnFlexWidth}))}
                    onColumnWidthsChange={this.onResising.bind(this, columnFlexWidth)}
                  />
                  <TableHeaderRow
                    showSortingControls
                    cellComponent={HeaderCellComponentBase}
                    messages={headerMessages}
                  />
                  <TableColumnVisibility
                    hiddenColumnNames={columns.filter(v => v.hidden).map(v => v.name)}
                    onHiddenColumnNamesChange={this.onHiddenChange}
                  />
                  <ColumnChooser
                    messages={{showColumnChooser: 'Выбор видимых колонок'}}
                  />
                  <TableFilterRow
                    showFilterSelector
                    iconComponent={FilterIcon}
                    messages={filterMessages}
                  />
                </Grid>
              </div>
            )
          }}
        </AutoSizer>
      </ErrorBoundary>
    );
  }
}

const getRowId = (row) => row.id;