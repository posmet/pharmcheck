import moment from 'moment';

export function formatDate(date, format) {
  if (!date) {
    return date;
  }
  return moment(date).format(format);
}