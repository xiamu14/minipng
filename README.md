# TODO

## 优化

- [ ] 修改中文提示，改成英文
- [ ] 添加 spinner

## 边界条件开发与测试

- [x] 多张图片同时上传，复制时；通过：正常有序的显示结果
- [x] .images 文件夹不存在时；通过：无显示退出
- [x] destination 文件夹不存在时；通过：显示提示信息，并退出
- [x] destination 是多层时：通过：正常压缩文件
- [ ] filename 的各种边界条件；通过：正常压缩文件，catch 错误，提示错误
  - [x] [hash] 测试
  - [x] [hash:0] 测试
  - [x] [hash:5] + [hash:6] 测试
  - [x] [hash:100] 测试
  - [ ] [name] 测试 ：destination 里存在同名文件时，提示操作，是否覆盖或重命名(未通过：文件被覆盖了)
  - [x] [id] 测试
  - [x] '[id]-[name].min' 测试
  - [x] '[id]-[name]-[hash].min' 测试
  - [x] [id]-[hash] 测试
  - [x] '[name].min' 测试
