/*
  Author: jagdish2157@gmail.com
  github: https://github.com/jagdish21
*/
const express = require('express');
const Sequelize = require('sequelize');
const CircuitBreaker = require('./lib/circuitBreaker');
const circuitBreakerOptions = require ('./lib/circuitBreakerOptions');

const app = express();
const port = 4000;


/* Configure Sequelize: Please replace userName, password, hostname and database name with your actual credentials */
const sequelize = new Sequelize({
    username: 'root',
    password: 'root',
    database: 'mydb',
    host: 'localhost',
    dialect: 'mssql',
    port: '1433',
    dialectOptions: {
      options: {
        encrypt: true, // Use this for Azure SQL
        trustServerCertificate: true, // For self-signed or local development
      },
    },
  });
// console.log(sequelize.config); //Checking SQL configuration log

async function executeStoredProcedure(mobile) {
    /* You may use inline query and SQL store procedures, replace sqlInlineQuery with sqlStoreProcedure */
    let sqlInlineQuery = ` SELECT * FROM users with(nolock) where mobile=:mobile`;
    /* let sqlStoreProcedure = "EXEC sqlStoreProcedureForGetUser @mobile = :mobile"; */
    const result = await sequelize.query(sqlInlineQuery, {
        replacements: { mobile }
    });
    return result;
}
// Create a circuit breaker instance
const circuitBreaker = new CircuitBreaker(executeStoredProcedure, circuitBreakerOptions);

// Define a route that uses the circuit breaker
app.get('/userdetails', async (req, res) => {
    const { mobile } = req.query;

    try {
        const result = await circuitBreaker.fire(mobile);
        res.send(result);
    } catch (error) {
        res.status(500).send('Service unavailable');
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});