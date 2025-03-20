const express = require('express');
const sharp = require('sharp');
const multer = require('multer');
const bodyParser = require('body-parser');

const app = express();

// 使用multer处理上传的图片
const upload = multer({ storage: multer.memoryStorage() });

app.use(bodyParser.json({ limit: '10mb' }));

app.get('/', (res) => {
    res.sendFile(__dirname + '/index.html');
});

/**
 * 图片压缩接口：
 * 接收图片和压缩比例
 * 返回压缩后的图片
 * 
 * @param {number} rate 压缩比例    
 * @param {file} image 图片
 * @return {file} 压缩后的图片
 * */
app.post('/imgCompress/compress', upload.single('image'), (req, res) => {
    // 接收图片和压缩比例
    const imageBuffer = req.file.buffer;
    const { rate } = req.body;

    if (rate < 0 || rate > 99) {
        return res.status(400).send('Rate must be between 1 and 99.');
    }

    const compressionQuality = rate * 1;  // 转换为压缩质量，rate越小，压缩越大

    let compressedImage;

    // 判断文件格式进行不同的处理
    sharp(imageBuffer)
        .metadata()
        .then(metadata => {
            if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
                // 对JPEG图片进行压缩
                compressedImage = sharp(imageBuffer)
                    .jpeg({ quality: compressionQuality })
                    .toBuffer();
            } else if (metadata.format === 'png') {
                // 对PNG图片进行压缩
                compressedImage = sharp(imageBuffer)
                    .png({ quality: compressionQuality })
                    .toBuffer();
            } else if (metadata.format === 'gif') {
                // 对GIF图片进行压缩
                compressedImage = sharp(imageBuffer, {
                    animated: true,
                    limitInputPixels: false,
                })
                    .gif({ quality: compressionQuality, colours: 128 })
                    .toBuffer();
            } else {
                return res.status(400).send('Unsupported image format.');
            }

            // 返回压缩后的图片
            compressedImage.then((data) => {
                res.set('Content-Type', 'image/' + metadata.format);
                res.send(data);
            }).catch(err => {
                res.status(500).send('Error compressing image: ' + err.message);
            });

        })
        .catch(err => {
            res.status(400).send('Error reading image metadata: ' + err.message);
        });
});

// 启动服务器
const port = 3000;
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});