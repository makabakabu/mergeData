import HEAD from "./HEAD"
import version from "./version"
import {
    isArray,
    isPlainObject,
    isEqual,
    get,
    dropRightWhile
} from 'lodash'

// path: { type: 'object' | 'array', name: '' }
function convertType2KeyValue(path, object) {
    switch (true) {
        case isPlainObject(object) && typeof object.id === 'string':
            return {
                [object.id]: path,
            };

        case isPlainObject(object) && typeof object.id !== 'string':
            return Object.entries(object).reduce((result, [key, value]) => ({
                ...result,
                ...convertType2KeyValue([...path, {
                    type: 'object',
                    name: key
                }], value)
            }), {});

        case isArray(object):
            return convertType2KeyValue([...path, {
                type: 'array',
                name: 0
            }], object[0])

        default:
            return {};
    }
}


function iterationMerge(targetTypeObject, path, arrayPath, sourceKeyValue, targetKeyValue, data, result) {
    const matchArrayPath = (arrayPath, matchPath) => isEqual(arrayPath, matchPath.slice(0, arrayPath.length))
    const convertPath2PathObject = (path) => path.map((certainPath) => ({
        type: typeof certainPath === 'string' ? 'object' : 'array',
        name: certainPath
    }))
    const mappingData = (sourcePath, targetPath, data, result) => {
        // 先结合 sourcePath 和 data -> targetPath, 数据然后投射到result中
        // 会将经过的地方如果没有设置的话设置成默认值
        // 首先将整个sourcePath分成以数组为 separator 的分割数组， 查看在这个路径上是否存在数据
        // * 如果存在 则直接覆盖上更改的数据
        // * 如果不存在则使用默认数据覆盖上， 然后在用data中的数据来overwrite
        const getPathList = (path) => {
            const {
                result,
                tempList
            } = sourcePath.reduce(({
                result,
                tempList
            }, certainPath) => {
                if (typeof certainPath === 'number') {
                    return {
                        result: [...result, [...tempList, certainPath]],
                        tempList: [],
                    }
                } else {
                    return {
                        result,
                        tempList: [...tempList, certainPath]
                    }
                }
            }, {
                result,
                tempList
            })
            return [...result, tempList]
        }

        const sourcePathList = getPathList(sourcePath)
        const targetPathList = getPathList(targetPath)
        // 在两个路径中打上节点
        return {

        }
    }

    const targetType = get(targetTypeObject, path)
    switch (true) {
        case isPlainObject(targetType) && typeof targetType.id === 'string':
            const sourcePath = sourceKeyValue[targetType.id];
            const targetPath = targetKeyValue[targetType.id];
            if (matchArrayPath(arrayPath, sourcePath) && sourcePath.filter(({
                    type
                }) => type === 'array').length === targetPath.filter(({
                    type
                }) => type === 'array').length) {
                return mappingData(sourcePath, targetPath, data, result)
            }
            return result;

        case isPlainObject(targetType) && typeof targetType.id !== 'string':
            return Object.entries(targetType).reduce((result, [key]) => iterationMerge(targetTypeObject, [...path, key], arrayPath, sourceKeyValue, targetKeyValue, data, result), result)

        case isArray(targetType):
            return iterationMerge(targetTypeObject, [...path, 0], convertPath2PathObject(dropRightWhile(path, (certainPath) => typeof certainPath === 'string')), sourceKeyValue, targetKeyValue, data, result)

        default:
            return {};
    }
}



function merge(versionId, data) {
    const sourceType = version[versionId].default //?
    const targetType = version[HEAD].default
    const sourceKeyValue = convertType2KeyValue([], sourceType) //?
    const targetKeyValue = convertType2KeyValue([], targetType) //?

    // 生成两个type成 typeId: path的形式
    // 每一个变量进行match， 如果匹配了， 然后路径也不冲突的话就可以
    // 不冲突验证： 数量一致即可
    // 比如说某一个数据在一个map -> map -> list
    // 另一个数据在map -> map中就不匹配
    // 首先将匹配的数据拿到然后将data的灌入
    // 最后补充上默认数据
}

merge('3.10_1583736509582', {})

export default merge