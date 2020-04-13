const HtmlWebpackPlugin = require("html-webpack-plugin");
const TsConfigWebpackPlugin = require("ts-config-webpack-plugin");
const ScssConfigWebpackPlugin = require("scss-config-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin").CleanWebpackPlugin;
const path = require("path");
const package = require("./package.json");

module.exports = {
  entry: {
    index: ["./src/index.ts"],
    palette: ["./src/palette.ts"],
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "docs"),
  },
  module: {
    rules: [
      {
        test: /\.glsl$/,
        loader: "webpack-glsl-loader",
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new TsConfigWebpackPlugin(),
    new ScssConfigWebpackPlugin(),
    new HtmlWebpackPlugin({
      chunks: ["index"],
      filename: "index.html",
      title: package.name,
    }),
    new HtmlWebpackPlugin({
      chunks: ["palette"],
      filename: "palette.html",
      title: package.name,
    }),
  ],
};
