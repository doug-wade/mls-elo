module.exports = function heightToInches(str) {
  const trimmed = str.replace('"', '');
  const [feet, inches] = trimmed.split("'");
  return (feet * 12) + (+inches);
}
