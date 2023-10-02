const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
const isMatch = require("date-fns/isMatch");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasPriorityAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasSearchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

//Convert DB Object to Response Object

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    category: dbObject.category,
    priority: dbObject.priority,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};

//Get Todos API 1

app.get("/todos/", async (request, response) => {
  const { category, priority, status, search_q = "" } = request.query;
  let getTodosQuery = "";
  let data = null;

  switch (true) {
    // Scenario 1

    case hasStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodosQuery = `SELECT * FROM todo WHERE status = '${status}';`;
        data = await db.all(getTodosQuery);
        response.send(
          data.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    // Scenario 2

    case hasPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodosQuery = `SELECT * FROM todo WHERE priority = '${priority}';`;
        data = await db.all(getTodosQuery);
        response.send(
          data.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    // Scenario 3

    case hasPriorityAndStatusProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `SELECT * FROM todo WHERE priority = '${priority}' AND 
            status = '${status}';`;
          data = await db.all(getTodosQuery);
          response.send(
            data.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    // Scenario 4

    case hasSearchProperty(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
      data = await db.all(getTodosQuery);
      response.send(
        data.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
      );
      break;

    // Scenario 5

    case hasCategoryAndStatus(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          Status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `SELECT * FROM todo WHERE category = '${category}' AND 
            status = '${status}';`;
          data = await db.all(getTodosQuery);
          response.send(
            data.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
          );
        } else {
          response.status(400);
          response.send("Invalid Tod status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo category");
      }
      break;

    // Scenario 6

    case hasCategoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodosQuery = `SELECT * FROM todo WHERE category = '${category}';`;
        data = await db.all(getTodosQuery);
        response.send(
          data.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    // Scenario 7

    case hasCategoryAndPriority(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getTodosQuery = `SELECT * FROM todo WHERE category = '${category}' AND 
                  priority = '${priority}';`;
          data = await db.all(getTodosQuery);
          response.send(
            data.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    // Default

    default:
      getTodosQuery = `SELECT * FROM todo`;
      data = await db.all(getTodosQuery);
      response.send(
        data.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
      );
      break;
  }
});

// Get Todos API 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const data = await db.get(getTodoQuery);
  response.send(convertDbObjectToResponseObject(data));
});

// Get Todos API 3

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    const getTodosQuery = `SELECT * FROM todo WHERE due_date = '${newDate}';`;
    const data = await db.all(getTodosQuery);
    response.send(
      data.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
    );
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//Post API 4

app.post("/todos/", async (request, response) => {
  const { id, todo, category, priority, status, dueDate } = request.body;

  if (status === "TO DO" || status === "In PROGRESS" || status === "DONE") {
    if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
          const createTodoQuery = ` 
            INSERT INTO 
              todo(id,todo,category,priority,status,due_date)
            VALUES
              (${id},'${todo}','${category}','${priority}','${status}','${newDueDate}');`;
          const data = await db.run(createTodoQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Status");
  }
});

//Update Todo API 5

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;

  const previousTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    category = previousTodo.category,
    priority = previousTodo.priority,
    status = previousTodo.status,
    dueDate = previousTodo.dueDate,
  } = request.body;

  let updateTodoQuery = "";

  switch (true) {
    //Scenario 1

    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodoQuery = `UPDATE todo SET 
          todo = '${todo}',
          category = '${category}',
          priority = '${priority}',
          status = '${status}',
          due_date = '${dueDate}'
          WHERE id = ${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    // Scenario 2

    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        updateTodoQuery = `UPDATE todo SET 
          todo = '${todo}',
          category = '${category}',
          priority = '${priority}',
          status = '${status}',
          due_date = '${dueDate}'
          WHERE id = ${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    // Scenario 3

    case requestBody.todo !== undefined:
      updateTodoQuery = `UPDATE todo SET 
        todo = '${todo}',
        category = '${category}',
        priority = '${priority}',
        status = '${status}',
        due_date = '${dueDate}'
        WHERE id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Todo Updated");
      break;

    // Scenario 4

    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateTodoQuery = `UPDATE todo SET 
            todo = '${todo}',
            category = '${category}',
            priority = '${priority}',
            status = '${status}',
            due_date = '${dueDate}'
            WHERE id = ${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    // Scenario 5

    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateTodoQuery = `UPDATE todo SET 
          todo = '${todo}',
          category = '${category}',
          priority = '${priority}',
          status = '${status}',
          due_date = '${newDueDate}'
          WHERE id = ${todoId};`;
        await db.run(updateTodoQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
  }
});

//Delete API 6

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM
      todo
    WHERE
      id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
