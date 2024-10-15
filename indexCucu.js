const fs = require('fs');
const csv = require('csv-parse');
const stringify = require('csv-stringify').stringify;
const fuzzball = require('fuzzball');

const inputFile = 'cucumbers.csv'; // использует разделитель ;
const categoriesFile = 'cucumScrapped.csv'; // использует разделитель ,
const outputFile = 'outputCucum.csv';

const exclusionList = [
    { product: 'Огурец Алексеич F1', category: 'Огурец Алекс F1' },
    { product: 'Огурец Аллигатор 2 F1', category: 'Огурец Аллигатор F1' },
    { product: 'Огурец Аллигатор 3 F1', category: 'Огурец Аллигатор F1' },
    { product: 'Огурец Аллигатор 4 F1', category: 'Огурец Аллигатор F1' },
    { product: 'Огурец Маша F1', category: 'Огурец Даша F1' },
    { product: 'Огурец Корюшка F1', category: 'Огурец Коротышка F1' },
    { product: 'Огурец Шоша F1', category: 'Огурец Гоша F1' },
    { product: 'Огурец Изумрудная семейка F1', category: 'Огурец Дружная Семейка F1' },
    { product: 'Огурец Изумрудный поток F1', category: 'Огурец Изумрудный Город F1' },
    { product: 'Огурец Сатина F1', category: 'Огурец Платина F1' },
    { product: 'Огурец Китайский змей', category: 'Огурец Китайский Император F1' },
];

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

// Функция для проверки на исключение
function isInExclusionList(productName, categoryName) {
    // Приводим всё к нижнему регистру и очищаем от лишних пробелов
    // if (productName == 'Огурец Алексеич F1') {
        // console.log("productName, categoryName", productName, categoryName )
    // }
        
    const cleanedProductName = productName.toLowerCase().trim();
    const cleanedCategoryName = categoryName.toLowerCase().trim();

    return exclusionList.some(exclusion => {
        return exclusion.product.toLowerCase().trim() === cleanedProductName && 
        exclusion.category.toLowerCase().trim() === cleanedCategoryName
    }
    );
}

// Функция сопоставления товаров с категориями
function assignCategories(products, categories) {
    categories.forEach(category => {
        const productName = category['prodPag'] || category['продукт']; // Проверяем последнюю колонку или колонку продукт
        products.forEach(product => {
            const modifiedProductName = trimLastThreeWords(product['Наименование'].replace('Огурец', ''));
            const matchScore = fuzzball.ratio(modifiedProductName, productName.replace('Огурец',''));

            // Пропускаем, если пара находится в списке исключений
            if (isInExclusionList(productName, trimLastThreeWords(product['Наименование']))) {
                console.log(`Исключено: ${product['Наименование']} и ${productName}`);
                return;
            }

            if (matchScore > 80) { // Порог совпадения 80%
                console.log(trimLastThreeWords(product['Наименование']), '-' ,productName, matchScore > 80);
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
