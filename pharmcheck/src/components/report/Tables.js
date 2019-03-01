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
import "react-virtualized/styles.css";
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

const HeaderCellComponentBase = ({ classes, ...restProps }) => (
  <TableHeaderRow.Cell
    {...restProps}
    className="test"
  />
);

const BandCellBase = ({children, tableRow, tableColumn, column, classes, ...restProps}) => {
  return (
    <TableBandHeader.Cell
      {...restProps}
      column={column}
    >
      <strong>
        {children.replace(new RegExp(`${separator}\\S+${separator}`), '')}
      </strong>
    </TableBandHeader.Cell>
  );
};

const tableMessages = {
  noData: '',
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
      itemPrefix: 'Сумма по полю: '
    }
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
                      <div title={`${map.itemPrefix || ''}${item.title}`} className={`extended-table__header_column-item original ${item.selected ? 'active' : ''}`}
                           ref={provided.innerRef}
                           {...provided.draggableProps}
                           {...provided.dragHandleProps}
                           style={getFieldItemStyle(
                             snapshot.isDragging,
                             provided.draggableProps.style,
                             snapshot
                           )}
                      >
                        {map.itemPrefix || ''}{item.title}
                      </div>
                      {snapshot.isDragging && map.isDropDisabled && (
                        <div className="extended-table__header_column-item active clone">{map.itemPrefix || ''}{item.title}</div>
                      )}
                    </React.Fragment>
                  )}
                </Draggable>
              ))}
            </div>
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

  getBandedTree = (index, node, tableColumns) => {
    const { columns, values } = this.props.extended;
    if (columns.length < index + 1) {
      return false;
    }
    if (!node.columnName) {
      node.columnName = columns[index].name;
    }
    let parentColumnName = '';
    if (!index) {
      node.title = columns[index].title;
      node.isParent = true;
    } else {
      parentColumnName = `${node.columnName}${separator}`;
    }
    const isLast = columns.length < index + 2;
    let groupedRows = _.groupBy(!index ? this.props.rows : node.rows, columns[index].name);
    node.children = [];
    _.keys(groupedRows).forEach((v, i) => {
      const name = `${parentColumnName}${columns[index].name}${separator}${v}`;
      let obj = {
        columnName: name,
        titleClean: v,
        title: `${v}${!node.isParent ? `${separator}${node.title}${separator}` : ''}`,
        grouping: node.grouping ? node.grouping.concat([{name: columns[index].name, value: v}]) : [{name: columns[index].name, value: v}],
      };
      // if (values.length > 1) {
      //   node.children.push({title: v, isLabel: true, columnName: v, children: []});
      //   console.log(v);
      //   values.forEach(vv => {
      //     node.children[i].children.push({columnName: `${name}${vv.name}`, name: `${name}${vv.name}`, title: `${v} - Сумма по полю ${vv.title}`});
      //     if (isLast) {
      //       tableColumns.push({...obj, name: `${name}${vv.name}`, nameClean: vv.name, title: `${v} - Сумма по полю ${vv.title}`});
      //     }
      //   });
      // } else {
        node.children.push({...obj, rows: groupedRows[v]});
        if (isLast) {
          tableColumns.push({...obj, name, nameClean: columns[index].name, title: v});
        }
      // }
    });
    node.children.forEach(v => {
      if (v.isLabel) {
        v.children.forEach(c => {
          this.getBandedTree(index + 1, c, tableColumns);
        });
      } else if (!v.isValue) {
        this.getBandedTree(index + 1, v, tableColumns);
      }
    });
    if (values.length > 0) {
      node.children = node.children.concat(values.map(v => ({
        isValue: true,
        columnName: `${parentColumnName}${v.name}`,
        title: `${node.titleClean || node.title} - Сумма по полю ${v.title}`
      })));
      values.forEach(v => {
        tableColumns.push({
          name: `${parentColumnName}${v.name}`,
          title: `${node.titleClean || node.title} - Сумма по полю ${v.title}`,
          isValue: true,
          // rows: node.children.filter(c => !v.isValue).reduce((sum, v) => sum.concat(v.rows || []), [])
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

  getRowAggregateValue = (rowName, rowValue, rowGrouping, columnName, columnValue, columnGrouping, valueName) => {
    console.log(rowName, columnName, valueName);
    rowGrouping = rowGrouping || [];
    columnGrouping = columnGrouping || [];
    let result = this.props.rows;
    columnGrouping.forEach(group => {
      result = result.filter(v => v[group.name] == group.value);
    });
    rowGrouping.forEach(group => {
      result = result.filter(v => v[group.name] == group.value);
    });
    console.log(rowName, rowValue, rowGrouping, columnName, columnValue, columnGrouping, result);
    return result.reduce((sum, v) => {
      let floatValue = parseFloat(v[valueName]);
      return isNaN(floatValue) ? sum : sum + floatValue;
    }, 0);
  };

  fillRow = (rowValue, rowName, parentId, id, rowGrouping, tableColumns) => {
    let obj = {[rowsTitleKey]: rowValue, parentId, id, grouping: rowGrouping};
    tableColumns.forEach(column => {
      if (column.name !== rowsTitleKey) {
        this.props.extended.values.forEach(v => {
          let value = this.getRowAggregateValue(rowName, rowValue, rowGrouping, column.titleClean, column.nameClean, column.grouping, v.name);
          console.log(value, column.name);
          obj[column.name] = value;
        });
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
    let grouping = [];
    if (columns.length) {
      let bandedObj = {};
      this.getBandedTree(0, bandedObj, tableColumns);
      banded = [bandedObj];
      // tableColumns = _.sortBy(tableColumns, 'name');
    } else if (values.length) {
      values.forEach(v => {
        tableColumns.push({
          name: `${v.name}`,
          title: `Сумма по полю ${v.title}`,
          isValue: true
        });
      });
    }

    // if (values.length) {
    //   tableColumns.push({name: summaryKey, title: 'Общий итог'});
    // }

    if (rows.length) {
      tableColumns.unshift({name: rowsTitleKey, title: 'Названия строк'});
      let bandedObj = {};
      this.getBandedRowTree(0, bandedObj, tableRows, tableColumns);
    } else if (tableColumns.length && values.length){
      tableRows = [this.fillRow(null, null, null, 1, [], tableColumns)];
    }

    /*if (rows.length) {
      tableColumns.unshift({name: rowsTitleKey, title: 'Названия строк'});
      // tableColumns = tableColumns.concat(rows.map(v => ({name: v.name, title: v.title})));
      // grouping = grouping.concat(rows.map(v => ({columnName: v.name})));
      let rowObj = {};
      let helpObj = {};
      rows.forEach((v, i) => {
        helpObj[i] = {
          startIndex: !tableRows.length ? 0 : tableRows.length,
          endIndex: 0,
          name: v.name
        };
        rowObj = _.groupBy(this.props.rows, v.name);
        if (helpObj[i - 1]) {
          let ids = tableRows.slice(helpObj[i - 1].startIndex, helpObj[i - 1].endIndex);
          if (ids && ids.length) {
            ids.forEach((t, newIndex) => {
              rowObj = _.groupBy(t.children, v.name);
              Object.keys(rowObj).forEach((key, index) => {
                tableRows.push(this.fillRow(key, v.name, t.id, tableRows.length + 1, rowObj[key], tableColumns));
              });
            });
          }
        } else {
          Object.keys(rowObj).forEach((key, index) => {
            tableRows.push(this.fillRow(key, v.name, i || null, tableRows.length + 1, rowObj[key], tableColumns));
          });
        }
        helpObj[i].endIndex = tableRows.length;
      });
    } else if (tableColumns.length && values.length){
      tableRows = [this.fillRow(null, null, null, 1, [], tableColumns)];
    }*/

    // tableRows = this.props.rows.map(v => ({...v, parentId: null}));

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
              <ExtendedDroppableColumn name="columns" items={columns} />
              <ExtendedDroppableColumn name="rows" items={rows} />
              <ExtendedDroppableColumn name="values" items={values} />
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