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
  CustomTreeData
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
const separator = '.^.';

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

  getBandedTree = (index, node, parent, tableColumns) => {
    const { columns, values } = this.props.extended;
    if (columns.length < index + 1) {
      return false;
    }
    if (!node.columnName) {
      node.columnName = columns[index].name;
    }
    if (!index) {
      node.title = columns[index].title;
      node.isParent = true;
    }
    const isLast = columns.length < index + 2;
    let groupedRows = _.groupBy(!index ? this.props.rows : node.rows, columns[index].name);
    const parentColumnName = parent ? `${node.columnName}${separator}` : '';
    node.children = _.keys(groupedRows).map(v => ({columnName: `${parentColumnName}${columns[index].name}${separator}${v}`, nodeTitle: v, title: `${v}${!node.isParent ? `(${node.title})` : ''}`, rows: groupedRows[v]}));
    if (isLast) {
      _.keys(groupedRows).forEach(v => {
        tableColumns.push({name: `${parentColumnName}${columns[index].name}${separator}${v}`, title: v});
      });
    }
    node.children.forEach(v => (() => {
      if (!v.isValue) {
        this.getBandedTree(index + 1, v, _.cloneDeep(node), tableColumns);
      }
    })(index, v, node));
    if (values.length > 0) {
      node.children = node.children.concat(values.map(v => ({isValue: true, columnName: `${parentColumnName}${v.name}`, title: `${node.nodeTitle || node.title} - Сумма по полю ${v.title}`})));
      values.forEach(v => {
        tableColumns.push({
          name: `${parentColumnName}${v.name}`,
          title: `${node.nodeTitle || node.title} - Сумма по полю ${v.title}`
        });
      });
    }
  };

  getChildRows = (row, rootRows) => {
    const childRows = rootRows.filter(r => r.parentId === (row ? row.id : null));
    return childRows.length ? childRows : null;
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
      this.getBandedTree(0, bandedObj, null, tableColumns);
      banded = [bandedObj];
      // tableColumns = _.sortBy(tableColumns, 'name');
    }

    if (values.length) {
      tableColumns.push({name: summaryKey, title: 'Общий итог'});
    }

    if (rows.length) {
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
                // console.log(newIndex, key);
                tableRows.push({[rowsTitleKey]: key, parentId: t.id, id: tableRows.length + 1, children: rowObj[key]});
              });
            });
          }
        } else {
          Object.keys(rowObj).forEach((key, index) => {
            tableRows.push({[rowsTitleKey]: key, parentId: i || null, id: tableRows.length + 1, children: rowObj[key]});
          });
        }
        helpObj[i].endIndex = tableRows.length;
      });
    }

    console.log(tableColumns, tableRows);

    if (rows.length) {
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
          <VirtualTable
            height="auto"
            tableComponent={TableComponent}
            messages={tableMessages}
          />

          <TableHeaderRow
            cellComponent={HeaderCellComponentBase}
          />

          <TableTreeColumn
            for={rowsTitleKey}
          />

          <TableBandHeader
            columnBands={banded}
          />
        </Grid>
      )
    }

    if (tableColumns.length && values.length){
      let obj = {};
      tableColumns.forEach(v => {
        obj[v.name] = 1;
      });
      for (let key in obj) {

      }
      tableRows = [obj];
    }

    console.log(tableRows);

    return (
      <Grid
        rows={tableRows}
        columns={tableColumns}
        getRowId={getRowId}
        rootComponent={this.tableRoot}
      >
        <VirtualTable
          height="auto"
          tableComponent={TableComponent}
          messages={tableMessages}
        />

        <TableHeaderRow
          cellComponent={HeaderCellComponentBase}
        />

        <TableBandHeader
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