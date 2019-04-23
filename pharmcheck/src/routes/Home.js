import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import {Card, Collapse, Button, Table, ButtonToolbar} from 'react-bootstrap';
import {formatDate} from '@utils/Formatter';

@inject('AppStore', 'ReportStore', 'RoutingStore')
@observer
class Home extends Component {

  state = {};
  reportMap = {};

  componentDidMount() {
    const { listSavedReports, listRequests, items } = this.props.ReportStore;
    items.forEach(item => {
      this.reportMap[item.id] = item;
    });
    listRequests();
    listSavedReports();
  }

  render() {
    const { props, reportMap } = this;
    const { ReportStore, RoutingStore } = props;
    const { requests, savedReports } = ReportStore;

    return (
      <>
        <Card>
          <Card.Header>Ваши сохраненные запросы</Card.Header>
          <Card.Body>
            <Table responsive bordered hover size="sm">
              <thead>
              <tr>
                <th>Название</th>
                <th>Описание</th>
                <th>Раздел</th>
                <th>Дата создания</th>
                <th>Действия</th>
              </tr>
              </thead>
              <tbody>
                {requests.map(item => {
                  return (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.description}</td>
                      <td>{reportMap[item.reptp] ? reportMap[item.reptp].name : ''}</td>
                      <td>{formatDate(item.created, 'MM.DD.YYYY')}</td>
                      <td>
                        <Button variant="outline-primary" size="sm" onClick={() => RoutingStore.push(`/reports/${item.reptp}/${item.id}`)}>Перейти</Button>
                        <Button variant="outline-danger" size="sm" onClick={() => ReportStore.deleteRequest(item.id)}>Удалить</Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
        <Card style={{marginTop: 20}}>
          <Card.Header>Ваши отчеты</Card.Header>
          <Card.Body>
            <Table responsive bordered hover size="sm">
              <thead>
              <tr>
                <th>Название</th>
                <th>Описание</th>
                <th>Раздел</th>
                <th>Дата создания</th>
                <th>Статус</th>
                <th>Формат</th>
                <th>Действия</th>
              </tr>
              </thead>
              <tbody>
              {savedReports.map(item => {
                return (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.description}</td>
                    <td>{reportMap[item.reptp] ? reportMap[item.reptp].name : ''}</td>
                    <td>{formatDate(item.created, 'MM.DD.YYYY')}</td>
                    <td>{item.status}</td>
                    <td>{item.format}</td>
                    <td>
                      <Button variant="outline-primary" size="sm" disabled={item.status === 1}><a href={`${process.env.HOST}/public/${item.id}.${item.format}`} download>Скачать</a></Button>
                      <Button variant="outline-danger" size="sm" onClick={() => ReportStore.deleteSavedReport(item.id)}>Удалить</Button>
                    </td>
                  </tr>
                )
              })}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </>
    );
  }
}

export default Home;