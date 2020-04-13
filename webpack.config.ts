const HtmlWebpackPlugin = require("html-webpack-plugin");
const TsConfigWebpackPlugin = require("ts-config-webpack-plugin");
const ScssConfigWebpackPlugin = require("scss-config-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin").CleanWebpackPlugin;
const path = require("path");
const package = require("./package.json");

const config = {
  entry: {
    index: ["./src/index.ts"],
    palette: ["./src/palette.ts"],
    worldGen: ["./src/worldGen.ts"],
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
    new TsConfigWebpackPlugin(),
    new ScssConfigWebpackPlugin(),
    new HtmlWebpackPlugin({
      chunks: ["index"],
      filename: "index.html",
      title: "Game",
    }),
    new HtmlWebpackPlugin({
      chunks: ["palette"],
      filename: "palette.html",
      title: "Palette Viewer",
    }),
    new HtmlWebpackPlugin({
      chunks: ["worldGen"],
      filename: "worldGen.html",
      title: "WorldGen Viewer",
    }),
  ],
};

module.exports = (env, argv) => {
  // if (argv.mode === 'development') {
  // }

  if (argv.mode === "production") {
    config.plugins.push(new CleanWebpackPlugin());
  }

  return config;
};
