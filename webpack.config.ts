const HtmlWebpackPlugin = require("html-webpack-plugin");
const TsConfigWebpackPlugin = require("ts-config-webpack-plugin");
const ScssConfigWebpackPlugin = require("scss-config-webpack-plugin");
const path = require("path");
const package = require("./package.json");

module.exports = {
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "docs")
  },
  module: {
    rules: [
      {
        test: /\.glsl$/,
        loader: "webpack-glsl-loader"
      }
    ]
  },
  plugins: [
    new TsConfigWebpackPlugin(),
    new ScssConfigWebpackPlugin(),
    new HtmlWebpackPlugin({
      title: package.name
    })
  ]
};
