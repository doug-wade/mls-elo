module.exports = function getBirthdateFromAgeString(str) {
  const [_, dateStr] = str.replace(')', '').split('(');
  return (new Date(dateStr)).getTime();
}
