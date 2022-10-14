const express = require('express')
const app = express()
const multer = require('multer');

app.use(express.static('./css'));
app.set('view engine', 'ejs')
app.set('views', './views')

const upload = multer()

const AWS = require('aws-sdk')
const config = new AWS.Config({
    accessKeyId: '',
    secretAccessKey: '',
    region: 'ap-southeast-1'
})

AWS.config = config
const docClient = new AWS.DynamoDB.DocumentClient();

const tableName = "BaiBao2"

//get index
app.get('/', function(req, res) {
    const params = {
        TableName: tableName
    }

    docClient.scan(params, (err, data) => {
        if (err) {
            res.send("Invalid: ", err)
        } else {
            return res.render('index', { baibaos: data.Items })
        }
    })
})

//get 
app.get('/add', (req, res) => {
    res.render('addBaiBao')
})

// validation
const regex = (so_trang, nam_XB, ten_bao) => {
    const error = [];
    if (parseInt(nam_XB) < 0) {
        error.push({ msg: "Năm xuất bản phải lớn hơn 0" })
    }
    if (parseInt(so_trang) < 0) {
        error.push({ msg: "Số trang phải lớn hơn 0" })
    }
    return error;
}

//add data
app.post('/add', upload.fields([]), (req, res) => {
    const { bai_bao, ten_bao, hinh_anh, ten_TacGia, chiso_ISBN, so_trang, nam_XB } = req.body;
    const errors = regex(so_trang, so_trang, ten_bao)

    if (errors.length > 0) {
        return res.render("addBaiBao", { errors });
    } else {
        const params = {
            TableName: tableName,
            Item: {
                "bai_bao": bai_bao,
                "hinh_anh": hinh_anh,
                "ten_bao": ten_bao,
                "ten_TacGia": ten_TacGia,
                "chiso_ISBN": chiso_ISBN,
                "so_trang": so_trang,
                "nam_XB": nam_XB
            }
        }
        docClient.put(params, (err, data) => {
            if (err) {
                console.log(".......", err)
                return res.send("Error", err);
            } else {
                return res.redirect("/");
            }
        })
    }
})

//delete data
app.post("/delete", upload.fields([]), (req, res) => { //req truyền qua
    const listItems = Object.keys(req.body)

    function onDelete(index) {
        const params = {
            TableName: tableName,
            Key: {
                "bai_bao": listItems[index]
            }
        }

        docClient.delete(params, (err, data) => {
            if (err) {
                console.log(".........", err)
                return res.send("Error ", err)
            } else {
                if (index > 0) {
                    onDelete(index - 1)
                } else {
                    return res.redirect("/");
                }
            }
        })
    }

    onDelete(listItems.length - 1)
})

app.listen(3004)