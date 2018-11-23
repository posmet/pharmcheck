import { Server, Faker, uid } from 'react-mock';
import { errorFormat } from '../data';
import { requests, addRequest, getRequest, deleteRequest } from './data';

const host = process.env.HOST;
const apiListRoute = `${host}/api/requests`;
const apiGetRoute = `${host}/api/requests/:id`;
const apiPostRoute = `${host}/api/requests/:id`;
const requestPostHandler = (request, generator) => {
  const { authorization } = request.requestHeaders;
  if (!authorization) {
    return [401, { 'Content-Type': 'application/json' }, JSON.stringify(errorFormat())];
  }
  const data = addRequest(request.params.id, JSON.parse(request.requestBody));
  return [200, { 'Content-Type': 'application/json' }, JSON.stringify(data)];
};

const requestGetHandler = (request, generator) => {
  const { authorization } = request.requestHeaders;
  if (!authorization) {
    return [401, { 'Content-Type': 'application/json' }, JSON.stringify(errorFormat())];
  }
  return [200, { 'Content-Type': 'application/json' }, JSON.stringify(getRequest(request.params.id))];
};

const requestListHandler = (request, generator) => {
  const { authorization } = request.requestHeaders;
  if (!authorization) {
    return [401, { 'Content-Type': 'application/json' }, JSON.stringify(errorFormat())];
  }
  return [200, { 'Content-Type': 'application/json' }, JSON.stringify(requests)];
};

const requestDeleteHandler = (request, generator) => {
  const { authorization } = request.requestHeaders;
  if (!authorization) {
    return [401, { 'Content-Type': 'application/json' }, JSON.stringify(errorFormat())];
  }
  deleteRequest(request.params.id);
  return [200, { 'Content-Type': 'application/json' }, JSON.stringify(requests)];
};

Server.mockGet(apiListRoute, requestListHandler);
Server.mockGet(apiGetRoute, requestGetHandler);
Server.mockPost(apiPostRoute, requestPostHandler);
Server.mockDelete(apiPostRoute, requestDeleteHandler);