import { Server, Faker, uid } from 'react-mock';
import { errorFormat } from '../data';
import { reports, savedReports, addReport, deleteReport, getReportData } from './data';

const host = process.env.HOST;
const apiRoute = `${host}/api/reports`;
const apiDataRoute = `${host}/api/reports/:id`;
const apiSavedRoute = `${host}/api/savedReports`;
const apiPostRoute = `${host}/api/savedReports/:id`;
const requestHandler = (request, generator) => {
  const { authorization } = request.requestHeaders;
  if (!authorization) {
    return [401, { 'Content-Type': 'application/json' }, JSON.stringify(errorFormat())];
  }
  return [200, { 'Content-Type': 'application/json' }, JSON.stringify(reports)];
};

const requestDataHandler = (request, generator) => {
  const { authorization } = request.requestHeaders;
  if (!authorization) {
    return [401, { 'Content-Type': 'application/json' }, JSON.stringify(errorFormat())];
  }
  return [200, { 'Content-Type': 'application/json' }, JSON.stringify(getReportData(request.params.id))];
};

const requestSavedHandler = (request, generator) => {
  const { authorization } = request.requestHeaders;
  if (!authorization) {
    return [401, { 'Content-Type': 'application/json' }, JSON.stringify(errorFormat())];
  }
  return [200, { 'Content-Type': 'application/json' }, JSON.stringify(savedReports)];
};

const requestPostHandler = (request, generator) => {
  const { authorization } = request.requestHeaders;
  if (!authorization) {
    return [401, { 'Content-Type': 'application/json' }, JSON.stringify(errorFormat())];
  }
  const data = addReport(request.params.id, JSON.parse(request.requestBody));
  return [200, { 'Content-Type': 'application/json' }, JSON.stringify(data)];
};

const requestDeleteHandler = (request, generator) => {
  const { authorization } = request.requestHeaders;
  if (!authorization) {
    return [401, { 'Content-Type': 'application/json' }, JSON.stringify(errorFormat())];
  }
  deleteReport(request.params.id);
  return [200, { 'Content-Type': 'application/json' }, JSON.stringify(savedReports)];
};

Server.mockGet(apiRoute, requestHandler);
Server.mockPost(apiDataRoute, requestDataHandler);
Server.mockGet(apiSavedRoute, requestSavedHandler);
Server.mockPost(apiPostRoute, requestPostHandler);
Server.mockDelete(apiPostRoute, requestDeleteHandler);