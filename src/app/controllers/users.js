import {
    PrismaClient
} from '@prisma/client';
const prisma = new PrismaClient();
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"



class usersController {
    async index(req, res) {
        try {
            const users = await prisma.users.findMany()
            if (!users || users.length === 0) {
               return res.status(404).json({
                    msg: "Não foi possível encontrar users na tabela"
                })
            }
            res.status(200).json(users)
        } catch (error) {
           return res.status(404).json({
                msg: error
            })
        }
    }
    async register(req, res) {
        try {
            const {
                email,
                name,
                password,
                comfirmpassword
            } = req.body
            if (!email) {
                return res.status(422).json({
                    msg: "O email é obrigatorio"
                })
            }
            if (!name) {
                return res.status(422).json({
                    msg: "O nome é obrigatorio"
                })
            }
            if (!password) {
                return res.status(422).json({
                    msg: "A senha é obrigatoria"
                })
                
            }

            if (!comfirmpassword) {
                return res.status(422).json({
                    msg: "O comfirmar senha é obrigatorio"
                })
                
            }

            if (password !== comfirmpassword) {
                return res.status(422).json({
                    msg: "As senhas não coferem"
                })
            }
            const userExist = await prisma.users.findUnique({
                where: {
                    email: email,
                },
            })
            if (userExist) {
                return res.status(422).json({
                    msg: "o email inserido já está sendo utilizado"
                })
            }
            const salt = await bcrypt.genSalt(12)
            const passwordHash = await bcrypt.hash(password, salt)
            const InsertUser = await prisma.users.create({
                data: {
                    email: email,
                    name: name,
                    password: passwordHash
                },
            })
           return res.status(201).json("Os dados foram inseridos na data base")
        } catch (error) {
            console.log(error)
            return res.status(404).json({
                msg: "Ocorreu um erro no servidor"
            })
        }
    }

    async login(req, res) {
        try {
            const {
                email,
                password
            } = req.body
            if (!email) {
                return res.status(422).json({
                    msg: "O email é obrigatorio"
                })
            }
            if (!password) {
                return res.status(422).json({
                    msg: "A senha é obrigatoria"
                })
            }
            const user = await prisma.users.findUnique({
                where: {
                    email: email,
                },
            })

            if (!user) {
                return res.status(422).json({
                    msg: "Usuario não encontrado"
                })
            }

            const checkpassword = await bcrypt.compare(password, user.password)

            if (!checkpassword) {
                return res.status(404).json({
                    msg: "Senha invalida"
                })
            }

            const secret = process.env.SECRET
            const token = jwt.sign({id: user.id,},secret, {expiresIn: "7d"})
    
           return res.status(200).json({msg: "Autenticação realizada com sucesso", token})

        } catch (error) {
            console.log(error)
           return res.status(404).json({msg: "Ocorreu um erro no servidor"})
        }
    }

   async access (req, res){
        const id = parseInt(req.params.id)
        const user = await prisma.users.findUnique({
            where: {
              id: id,
            },
            select:{
                id: true,
                name: true,
                email: true
            }
          })
          if(!user){
            return res.status(404).json({msg:"Usuario não encontrado"})
          }
          res.status(201).json(user)
    }
}


export default new usersController()