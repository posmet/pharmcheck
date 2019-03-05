import React, { Component } from 'react';
import { toJS } from 'mobx';
import _ from 'lodash';
import uuid from 'uuid/v4';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import ErrorBoundary from '@components/common/ErrorBoundary';
import { withStyles } from '@material-ui/core/styles';
import {
  GroupingState,
  IntegratedGrouping,
  TreeDataState,
  CustomTreeData,
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
} from '@devexpress/dx-react-grid-material-ui';
import { AutoSizer } from "react-virtualized";
import { Menu, Item, contextMenu } from 'react-contexify';
import classNames from 'classnames';

const summaryKey = 'frontSummary';
const rowsTitleKey = 'frontRowsTitle';
const separator = '#_#';

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

const valuesMap = {
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
                      <div onClick={this.onShowMenu.bind(this, item, index)} title={`${map.itemPrefix ? `${valuesMap[item.value || 'sum'].full}${map.itemPrefix}` : ''}${item.title}`} className={`extended-table__header_column-item original ${item.selected ? 'active' : ''}`}
                           ref={provided.innerRef}
                           {...provided.draggableProps}
                           {...provided.dragHandleProps}
                           style={getFieldItemStyle(
                             snapshot.isDragging,
                             provided.draggableProps.style,
                             snapshot
                           )}
                      >
                        {map.itemPrefix ? `${valuesMap[item.value || 'sum'].full}${map.itemPrefix}` : ''}{item.title}
                        {!map.isDropDisabled ? <span className="close" onClick={this.props.onDelete.bind(this, index)}>×</span> : null}
                      </div>
                      {snapshot.isDragging && map.isDropDisabled && (
                        <div className="extended-table__header_column-item active clone">{map.itemPrefix ? `${valuesMap[item.value || 'sum'].full}${map.itemPrefix}` : ''}{item.title}</div>
                      )}
                    </React.Fragment>
                  )}
                </Draggable>
              ))}
            </div>
            <Menu id={name}>
              <Item onClick={this.onChangeMenu.bind(this, 'sum')}>Сумма(Σ)</Item>
              <Item onClick={this.onChangeMenu.bind(this, 'avg')}>Среднее(avg)</Item>
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

export class ExtendedTable extends React.PureComponent {

  state = {
    expandedRowIds: []
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
      array.splice(destination.index, 0, clone);
      onChange(this.props.extended, this.props.columns);
    } else {
      if (!destination) { //удаляем
        const [removed] = this.props.extended[source.droppableId].splice(result.source.index, 1);
        let item = this.props.columns.find(row => row.name === removed.name);
        item.selected = false;
        onChange(this.props.extended, this.props.columns);
        return false;
      }
      //перемещаем/меняем позицию
      const [removed] = this.props.extended[source.droppableId].splice(result.source.index, 1);
      this.props.extended[destination.droppableId].splice(destination.index, 0, removed);
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
              title: isLast ? `${v} - ${valuesMap[vv.value || 'sum'].short}: ${vv.title}` : v
            });
            tableColumns.push({
              ...obj,
              name: `${name}${vv.name}`,
              nameClean: vv.name,
              title: `${v} - ${valuesMap[vv.value || 'sum'].short}: ${vv.title}`,
              valueProps: {name: vv.name, value: vv.value},
              isValue: true
            });
          });
        }
      } else {
        node.children.push({...obj});
        if (isLast) {
          tableColumns.push({...obj, name, nameClean: columns[index].name, title: v, valueProps: values.length ? {name: values[0].name, value: values[0].value} : undefined});
        }
      }
    });
    node.children.forEach(v => {
      if (!v.isValue) {
        this.getBandedTree(!v.isLabel ? index + 1 : index, v, tableColumns);
      }
    });
    if (values.length > 0 && !node.isLabel) {
      node.children = node.children.concat(values.map(v => ({
        isValue: true,
        columnName: `${parentColumnName}${v.name}`,
        title: `${node.titleClean || node.title} - ${valuesMap[v.value || 'sum'].short}: ${v.title}`,
        grouping: node.grouping,
      })));
      values.forEach(v => {
        tableColumns.push({
          name: `${parentColumnName}${v.name}`,
          title: `${node.titleClean || node.title} - ${valuesMap[v.value || 'sum'].short}: ${v.title}`,
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
    let totally = result.reduce((sum, v) => {
      let floatValue = parseFloat(v[valueProps.name]);
      return isNaN(v[valueProps.name]) || isNaN(floatValue) ? sum : sum + floatValue;
    }, 0);
    switch (valueProps.value) {
      case 'avg':
        totally = result.length ? totally/result.length : totally;
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

  tableRoot = (props) => <Grid.Root {...props} className="material-table-bordered" style={{ height: "100%", maxHeight: this.props.rows.length ? 550 : 400 }}/>;

  get table() {
    const { columns, rows, values } = this.props.extended;
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
          name: `${v.name}`,
          title: `${valuesMap[v.value || 'sum'].short}: ${v.title}`,
          isValue: true,
          valueProps: {name: v.name, value: v.value},
        });
      });
    }

    if (rows.length) {
      tableColumns.unshift({name: rowsTitleKey, title: 'Названия строк'});
      let bandedObj = {};
      this.getBandedRowTree(0, bandedObj, tableRows, tableColumns);
    } else if (tableColumns.length && values.length){
      tableRows = [this.fillRow(null, null, null, 1, [], tableColumns)];
    }

    console.log(banded, tableColumns, tableRows);

    return (
      <Grid
        rows={tableRows}
        columns={tableColumns}
        getRowId={getRowId}
        rootComponent={this.tableRoot}
      >

        <TreeDataState
          defaultExpandedRowIds={tableRows.length ? [tableRows[0].id] : []}
        />
        <CustomTreeData
          getChildRows={this.getChildRows}
        />
        <Table
          height="auto"
          tableComponent={TableComponent}
          messages={tableMessages}
        />

        <TableHeaderRow
          cellComponent={HeaderCellComponent}
        />

        <TableTreeColumn
          for={rowsTitleKey}
        />

        <TableBandHeader
          cellComponent={BandCell}
          columnBands={banded}
        />
      </Grid>
    )
  }

  render() {
    const { rows, columns, values } = this.props.extended;

    return (
      <div className="extended-table">
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
                  <DragDropProvider/>
                  <GroupingState
                    grouping={columns.filter(v => v.grouping).map(v => ({columnName: v.name}))}
                    onGroupingChange={this.onGroupingChange}
                  />
                  <IntegratedGrouping/>
                  <VirtualTable
                    height="auto"
                    tableComponent={TableComponent}
                    messages={tableMessages}
                  />
                  <TableGroupRow/>
                  <Toolbar/>
                  <GroupingPanel
                    showGroupingControls
                    messages={{groupByColumn: 'Перетащите сюда колонку для группировки'}}
                  />
                  <TableColumnReordering
                    order={columns.map(v => v.name)}
                    onOrderChange={this.onOrderChange}
                  />
                  {/*<TableColumnResizing
                    columnWidths={columns.map(v => {
                      return {
                        columnName: v.name,
                        width: v.width || columnFlexWidth
                      };
                    })}
                    onColumnWidthsChange={changed => {
                      changed.forEach((v, i) => {
                        if (v.width !== columnFlexWidth) {
                          columns[i].width = v.width;
                        }
                      });
                      this.setState({columns: columns.slice()});
                    }}
                  />*/}
                  <TableHeaderRow
                    cellComponent={HeaderCellComponentBase}
                  />
                  <TableColumnVisibility
                    hiddenColumnNames={columns.filter(v => v.hidden).map(v => v.name)}
                    onHiddenColumnNamesChange={this.onHiddenChange}
                  />
                  <ColumnChooser
                    messages={{showColumnChooser: 'Выбор видимых колонок'}}
                  />
                  <TableBandHeader
                    columnBands={[]}
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