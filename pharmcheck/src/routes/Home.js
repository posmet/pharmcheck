import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import {Card, Collapse, Button, Table, ButtonToolbar} from 'react-bootstrap';

@inject('AppStore', 'ReportStore', 'RoutingStore')
@observer
class Home extends Component {

  state = {};

  componentDidMount() {
    const { listSavedReports, listRequests } = this.props.ReportStore;
    listRequests();
    listSavedReports();
  }

  render() {
    const { props } = this;
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
                      <td>{item.report ? item.report.name : ''}</td>
                      <td>{item.created}</td>
                      <td>
                        <Button variant="outline-primary" onClick={() => RoutingStore.push(`/reports/${item.report.id}/${item.id}`)}>Перейти</Button>
                        <Button variant="outline-danger" onClick={() => ReportStore.deleteRequest(item.id)}>Удалить</Button>
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
                    <td>{item.report ? item.report.name : ''}</td>
                    <td>{item.created}</td>
                    <td>{item.status.name}</td>
                    <td>{item.format}</td>
                    <td>
                      <Button variant="outline-primary" disabled={item.status.id === 1}>Скачать</Button>
                      <Button variant="outline-danger" onClick={() => ReportStore.deleteSavedReport(item.id)}>Удалить</Button>
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