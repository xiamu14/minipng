# Install

```shell
pnpm add -D nanopng
```

# Usage

```shell
pnpm nanopng --filename='[name]-[hash:6]' --dest='public/assets/images'
```

<img src="https://github.com/xiamu14/nanopng/blob/master/screenshots/cbpk.png?raw=true" alt="screenshots" title="A cute kitten" width="400" height="400" style="object-fit:contain;" />

# TODO

## 优化

- [x] 修改中文提示，改成英文
- [x] 添加 spinner

## 边界条件开发与测试

- [x] 多张图片同时上传，复制时；通过：正常有序的显示结果
- [x] .images 文件夹不存在时；通过：无显示退出
- [x] destination 文件夹不存在时；通过：显示提示信息，并退出
- [x] destination 是多层时：通过：正常压缩文件
- [x] filename 的各种边界条件；通过：正常压缩文件，catch 错误，提示错误
  - [x] [hash] 测试
  - [x] [hash:0] 测试
  - [x] [hash:5] + [hash:6] 测试
  - [x] [hash:100] 测试
  - [x] [name] 测试 ：destination 里存在同名文件时，跳过并提示重命名
  - [x] [id] 测试
  - [x] '[id]-[name].min' 测试
  - [x] '[id]-[name]-[hash].min' 测试
  - [x] [id]-[hash] 测试
  - [x] '[name].min' 测试
