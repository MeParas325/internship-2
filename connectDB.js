const mysql = require("mysql2/promise");
const fs = require("fs");

let connection;

async function connectDB() {
    try {
        connection = await mysql.createConnection({
            host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
            user: 'Me9QLCTP58PrvG6.root',
            password: 'HgQurDW76sMwmgbI',
            database: 'test',
            port: 4000,
            ssl: {
                ca: fs.readFileSync('./ca.pem')  // Path to the certificate file
            }
        });
        console.log("Connected successfully");
    } catch (error) {
        console.log("Error occurred: ", error.toString());
    }
}

async function addSchoolToDB({ name, address, latitude, longitude }) {
    const insertUserQuery = `
      INSERT INTO SchoolsTable (name, address, latitude, longitude)
      VALUES (?, ?, ?, ?)
    `;

    const newUserValues = [
        name,
        address,
        latitude,
        longitude,
    ];

    try {
        // Use `await` to ensure the query is finished before proceeding
        await connection.execute(insertUserQuery, newUserValues);
        return true;
    } catch (error) {
        console.error('Error adding school to DB:', error);
        return false;
    }
}

function toRad(degrees) {
    return degrees * Math.PI / 180;
}

function calculateDistance(userLat, userLon, schoolLat, schoolLon) {
    const R = 6371; // Earth's radius in kilometers

    const deltaLat = toRad(schoolLat - userLat);
    const deltaLon = toRad(schoolLon - userLon);

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(toRad(userLat)) * Math.cos(toRad(schoolLat)) *
        Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // in kilometers

    return distance; // return the distance in kilometers
}

// Sort Schools by distance from user
function sortSchoolsByDistance(userLat, userLon, schools) {
    schools.forEach(school => {
        school["distance"] = calculateDistance(userLat, userLon, school["latitude"], school["longitude"]);
    });

    // Sort by distance in ascending order
    schools.sort((a, b) => a["distance"] - b["distance"]);

    return schools;
}

async function listSchoolFromDB({ latitude, longitude }) {
    const lat = parseFloat(latitude)
    const long = parseFloat(longitude)

    const getSchoolsQuery = `SELECT * FROM SCHOOLSTABLE`

    try {
        // Await the result of the query, which returns a promise
        const [rows, fields] = await connection.execute(getSchoolsQuery)
        if (rows.length == 0) return []
        return sortSchoolsByDistance(lat, long, rows)
    } catch (error) {
        console.error('Error fetching schools from DB:', error);
    }
}

module.exports = {
    connectDB,
    addSchoolToDB,
    listSchoolFromDB
};
