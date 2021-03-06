import db from '../database/db_connection';

export default {
  all: (offset = 0, limit = 0) => new Promise((resolve, reject) =>
    db.query(`
          SELECT *, count(*) OVER() AS rows_count FROM businesses
          OFFSET $1
          LIMIT $2`, [offset, limit])
      .then(({ rows }) => resolve(rows))
      .catch(reject)
  ),
  // add data here and then test
  edit: (data) => new Promise((resolve, reject) => db.query(`
      UPDATE businesses SET 
      name=$1, phone=$2, email=$3,
      description=$4, cuisine=$5, address=$6, 
      lat=$7,lng=$8, business_type=$9, status=$10
      WHERE id=$11`,
  [data.name, data.phone, data.email, data.description, data.cuisine, data.address,
    data.lat, data.lng, data.business_type, data.status, data.id])
    .then(({ rows }) => resolve(rows))
    .catch(reject)

  ),

  // get all businesses with the average ratings from all reviews
  // POST /businesses
  getBusinessesWithRating: () => new Promise((resolve, reject) => db.query(
          `SELECT 
            business.id, business.lat, business.lng, business.primaryimage AS image,
            business.name, ROUND(AVG(reviews.rating)) AS rating, business.description,
            business.cuisine,business.business_type AS type
          FROM businesses 
          business LEFT JOIN reviews ON reviews.business_id = business.id
          WHERE status='approved' 
          GROUP BY business.id`
  )
    .then(({ rows }) => resolve(rows))
    .catch(reject)),

  // get the top 5 rated businesses
  // to be changed
  // POST /businesses
  getTopRated: () => new Promise((resolve, reject) => db.query(
        `SELECT 
            business.id, business.primaryimage as image, business.name, ROUND(AVG(reviews.rating)) AS rating,
            business.description, business.cuisine, business.business_type AS type 
        FROM  businesses business LEFT JOIN reviews ON reviews.business_id = business.id 
        WHERE status='approved' 
        GROUP BY business.id 
        ORDER BY avg(reviews.rating) desc 
        LIMIT 5`
  )
    .then(({ rows }) => resolve(rows))
    .catch(reject)),

  // GET /businesses/:id
  getBusinessById: (id) => new Promise((resolve, reject) => Promise.all([
    db.query(
        `SELECT 
          business.id, business.lat, business.lng, business.primaryimage AS image,
          business.name, ROUND(AVG(reviews.rating)) AS rating, business.description,
          business.cuisine,business.business_type AS type, business.phone,
          business.email, business.address
        FROM businesses 
        business LEFT JOIN reviews ON reviews.business_id = business.id
        WHERE status='approved' AND business.id=$1 
        GROUP BY business.id`, [id]),
    db.query('SELECT image_url AS url FROM images WHERE business_id = $1', [id]),
    db.query(`SELECT 
        reviews.rating, reviews.created_at, 
        reviews.review_body, users.profile_image,
        CONCAT(users.first_name, ' ', users.last_name) AS fullname
        FROM reviews
        LEFT JOIN users ON users.id = reviews.user_id 
        WHERE business_id = $1`, [id])
  ])
    .then(([business, images, reviews]) => {
      const resultBusiness = {
        ...business.rows[0],
        reviews: reviews.rows,
        images: images.rows
      };
      console.log(1, resultBusiness);
      resolve(resultBusiness);
    })
    .catch(reject)),
  // POST /new-businesses
  create: (data) => new Promise((resolve, reject) =>
  //   add the new business into the database and return the id
    db.query(
        `INSERT INTO businesses
         (
            user_id, name, primaryImage, description, cuisine,
            lat, lng, business_type, phone, address, email, parking, freeWifi, smokingArea
        )
          VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
          RETURNING id`,
        [
          data.userId, data.name, data.primaryImage, data.description,
          data.cuisine, data.lat, data.lng, data.type,
          data.phone, data.address, data.email, data.parking,
          data.freeWifi, data.smokingArea
        ]
    )
      .then(({ rows }) =>
      //   after returning the id add the sub images
        Promise.all(
          data.subImgs.map((subImageUrl) =>
            db.query(
              'INSERT INTO images (business_id, image_url) VALUES($1, $2)',
              [rows[0].id, subImageUrl])
          )
        )
          .then(({ rows }) => resolve(true)))
      .catch(reject)
  ),
  changeStatus: (status, id) => new Promise((resolve, reject) =>
    db.query('UPDATE businesses SET status=$1 WHERE id=$2', [status, id])
      .then(({ rows }) => resolve(rows))
      .catch(reject)
  )

};
