const express = require("express")
const app = express()
const PORT = 3000
const {connectDB, addSchoolToDB, listSchoolFromDB} = require("./connectDB")
const zod = require("zod")

const schema = zod.object({
    name: zod.string().nonempty().max(255, "Name must be at most 20 characters long"),
    address: zod.string().nonempty().max(255, "Address must be at most 255 characters long"),
    latitude: zod.number().min(-90, "Latitude must be between -90 and 90").max(90, "Latitude must be between -90 and 90"),
    longitude: zod.number().min(-180, "Longitude must be between -180 and 180").max(180, "Longitude must be between -180 and 180")
});

// DB connection
connectDB()
app.get("/", (req, res) => {
    res.send("School backend")
})

app.use(express.json())

app.post("/addSchool", (req, res) => {
    console.dir(req.body)
    const {success} = schema.safeParse(req.body)
    console.log("Success is: ", success)
    if(!success) {
        return res.status(401).json({
            msg: "Inputs are not valid"
        })
    }
    
    if(addSchoolToDB(req.body)) {
        res.json({
            msg: "School added successfully"
        })
    } else {
        res.status(501).json({
            msg: "Internal server error"
        })
    }
})

app.get("/listSchools", async (req, res) => {

    const listOfSchools = await listSchoolFromDB(req.query)

    if(listOfSchools?.length > 0) {
        res.status(200).json(listOfSchools[0])
    } else if(listOfSchools?.length == 0) {
        res.status(200).json({
            msg: "No schools is available in the database"
        })
    } else {
        res.status(501).json({
            msg: "Check your query parameters! Parameters should be in int or float format"
        })
    }
   
})

app.listen(PORT, () => {
    console.log(`App is listening at: http://localhost:${PORT}`)
})