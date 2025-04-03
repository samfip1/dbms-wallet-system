import mysql from "mysql2/promise";

//1: connecting to the mysql server
//2: create a db
//3: create a table

try {

    const db = await mysql.createConnection({
        host: "localhost",
        user : "root",
        password : "1234",
        database : "dbms_wallet_system"
    })
    // const table = await db.execute("CREATE DATABASE IF NOT EXISTS testdb;");
    // console.log(table);

    
    console.log(await db.execute("show databases"));
    console.log(await db.execute("show tables;"))

} catch (error) {
    console.log(error);
    console.log("Connected to MySql server Unsuccesssfully");
}

