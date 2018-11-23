import { toast } from 'react-toastify';

export function errorHandler(opts, res) {
  const {showToast, fn, stopLoading, message} = opts;
  if (showToast && res && res.body && !res.abort) {
    if (res.body.messages) {
      res.body.messages.forEach(msg => toast.info(msg.message));
    } else {
      toast.info(message || res.body.message);
    }
  }
  if (stopLoading) {
    this.loading = false;
  }
  return fn && fn(res);
}

export function success(message) {
   toast.success(message);
}
