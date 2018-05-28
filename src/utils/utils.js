Date.prototype.format = function formatDate() {
  const date = this;
  return `${date.getFullYear()}-${(date.getMonth() + 1 + '').padStart(2, 0)}-${(date.getDate() + '').padStart(2, 0)} ${(date.getHours() + '').padStart(2, 0)}'${(date.getMinutes() + '').padStart(2, 0)}'${(date.getSeconds() + '').padStart(2, 0)}.${(date.getMilliseconds() + '').padStart(3, 0)}`;
};