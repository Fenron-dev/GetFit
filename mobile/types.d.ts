// Schriftdateien werden als Modul eingebunden; Metro liefert die
// Asset-Kennung, TypeScript braucht die Zusage, dass es sie gibt.
declare module '*.ttf' {
  const asset: number;
  export default asset;
}
