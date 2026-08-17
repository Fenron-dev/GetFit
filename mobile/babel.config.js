/**
 * Reanimated 4 arbeitet mit Worklets — Funktionen, die auf dem
 * UI-Thread laufen. Das Babel-Plugin wandelt sie um und muss als
 * letztes greifen. babel-preset-expo bringt es nicht von allein mit.
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-worklets/plugin'],
  };
};
