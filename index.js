// const fs = require('fs');
// const csv = require('csv-parse');
// const stringify = require('csv-stringify').stringify;
// const fuzzball = require('fuzzball');

// const inputFile = 'products.csv'; // использует разделитель ;
// const categoriesFile = 'tomats.csv'; // использует разделитель ,
// const outputFile = 'output.csv';

// // Функция для чтения CSV файла, с возможностью указания разделителя
// function readCSV(filePath, delimiter) {
//     const data = [];
//     return new Promise((resolve, reject) => {
//         fs.createReadStream(filePath)
//             .pipe(csv.parse({ delimiter: delimiter, columns: true }))
//             .on('data', (row) => data.push(row))
//             .on('end', () => resolve(data))
//             .on('error', (error) => reject(error));
//     });
// }

// // Функция сопоставления товаров с категориями
// function assignCategories(products, categories) {
//     categories.forEach(category => {
//         const productName = category['prodPag'] || category['продукт']; // Проверяем последнюю колонку или колонку продукт
//         // console.log(productName);
//         products.forEach(product => {
//             const matchScore = fuzzball.ratio(product['Наименование'].replace('Томат',''), productName.replace('Томат',''));
            
//             if (matchScore > 50) { // Порог совпадения 75%
//                 console.log(productName, ' - ' ,product['Наименование'], matchScore > 50)
//                 if (product['Теги']) {
//                     product['Теги'] += `, ${category['категория']}`;
//                 } else {
//                     product['Теги'] = category['категория'];
//                 }
//             }
//         });
//     });
//     return products;
// }

// // Основная функция для выполнения чтения и записи файла
// async function main() {
//     try {
//         const products = await readCSV(inputFile, ';');
//         const categories = await readCSV(categoriesFile, ',');
//         const processedData = assignCategories(products, categories);
//         stringify(processedData, { header: true, delimiter: ';' }, (err, output) => {
//             if (err) throw err;
//             fs.writeFile(outputFile, output, (err) => {
//                 if (err) throw err;
//                 console.log('CSV file has been written successfully with categories assigned.');
//             });
//         });
//     } catch (error) {
//         console.error('Error:', error);
//     }
// }

// main();


const fs = require('fs');
const csv = require('csv-parse');
const stringify = require('csv-stringify').stringify;
const fuzzball = require('fuzzball');

const inputFile = 'products.csv'; // использует разделитель ;
const categoriesFile = 'tomats.csv'; // использует разделитель ,
const outputFile = 'output.csv';

// Функция для чтения CSV файла, с возможностью указания разделителя
function readCSV(filePath, delimiter) {
    const data = [];
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv.parse({ delimiter: delimiter, columns: true }))
            .on('data', (row) => data.push(row))
            .on('end', () => resolve(data))
            .on('error', (error) => reject(error));
    });
}

// Функция для обрезки последних трёх слов в строке
function trimLastThreeWords(text) {
    const words = text.split(' ');
    if (words.length > 3) {
        return words.slice(0, -3).join(' ');
    }
    return text; // Возвращаем исходный текст, если в нём меньше трёх слов
}

// Функция сопоставления товаров с категориями
function assignCategories(products, categories) {
    categories.forEach(category => {
        const productName = category['prodPag'] || category['продукт']; // Проверяем последнюю колонку или колонку продукт
        products.forEach(product => {
            const modifiedProductName = trimLastThreeWords(product['Наименование'].replace('Томат', ''));
            const matchScore = fuzzball.ratio(modifiedProductName, productName.replace('Томат',''));
            
            if (matchScore > 80) { // Порог совпадения 50%
                console.log(productName, ' - ' ,product['Наименование'], matchScore > 80)
                const newCategory = category['категория'];
                if (product['Теги']) {
                    // Проверяем, есть ли уже такой тег в списке
                    const tags = product['Теги'].split(', ').map(tag => tag.trim());
                    if (!tags.includes(newCategory)) {
                        product['Теги'] += `, ${newCategory}`;
                    }
                } else {
                    product['Теги'] = newCategory;
                }
            }
        });
    });
    return products;
}

// Основная функция для выполнения чтения и записи файла
async function main() {
    try {
        const products = await readCSV(inputFile, ';');
        const categories = await readCSV(categoriesFile, ',');
        const processedData = assignCategories(products, categories);
        stringify(processedData, { header: true, delimiter: ';' }, (err, output) => {
            if (err) throw err;
            fs.writeFile(outputFile, output, (err) => {
                if (err) throw err;
                console.log('CSV file has been written successfully with categories assigned.');
            });
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

main();
