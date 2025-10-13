const bcrypt = require('bcrypt');
const db = require('./database');

class AuthService {
  /**
   * Register a new user
   */
  async register(userData) {
    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      return new Promise((resolve, reject) => {
        const sql = `
          INSERT INTO users (name, email, password, postal_address, telephone)
          VALUES (?, ?, ?, ?, ?)
        `;

        db.db.run(
          sql,
          [
            userData.name,
            userData.email,
            hashedPassword,
            userData.postal_address,
            userData.telephone
          ],
          function(err) {
            if (err) {
              if (err.message.includes('UNIQUE constraint failed')) {
                reject(new Error('Email already registered'));
              } else {
                reject(err);
              }
            } else {
              // Return user without password
              resolve({
                id: this.lastID,
                name: userData.name,
                email: userData.email,
                postal_address: userData.postal_address,
                telephone: userData.telephone
              });
            }
          }
        );
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(email, password) {
    try {
      return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM users WHERE email = ?';

        db.db.get(sql, [email], async (err, user) => {
          if (err) {
            reject(err);
            return;
          }

          if (!user) {
            reject(new Error('Invalid email or password'));
            return;
          }

          // Compare password
          const validPassword = await bcrypt.compare(password, user.password);

          if (!validPassword) {
            reject(new Error('Invalid email or password'));
            return;
          }

          // Return user without password
          const { password: _, ...userWithoutPassword } = user;
          resolve(userWithoutPassword);
        });
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT id, name, email, postal_address, telephone, profile_picture, created_date FROM users WHERE id = ?';

      db.db.get(sql, [userId], (err, user) => {
        if (err) {
          reject(err);
        } else {
          resolve(user);
        }
      });
    });
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT id, name, email, postal_address, telephone, profile_picture, created_date FROM users WHERE email = ?';

      db.db.get(sql, [email], (err, user) => {
        if (err) {
          reject(err);
        } else {
          resolve(user);
        }
      });
    });
  }

  /**
   * Update user profile
   */
  async updateUser(userId, userData) {
    return new Promise((resolve, reject) => {
      const fields = [];
      const params = [];

      if (userData.name !== undefined) {
        fields.push('name = ?');
        params.push(userData.name);
      }
      if (userData.postal_address !== undefined) {
        fields.push('postal_address = ?');
        params.push(userData.postal_address);
      }
      if (userData.telephone !== undefined) {
        fields.push('telephone = ?');
        params.push(userData.telephone);
      }
      if (userData.profile_picture !== undefined) {
        fields.push('profile_picture = ?');
        params.push(userData.profile_picture);
      }

      if (fields.length === 0) {
        return resolve({ id: userId, changes: 0 });
      }

      params.push(userId);

      const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;

      db.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: userId, changes: this.changes });
        }
      });
    });
  }

  /**
   * Change user password
   */
  async changePassword(userId, oldPassword, newPassword) {
    return new Promise(async (resolve, reject) => {
      try {
        // First get the user to verify old password
        const sql = 'SELECT password FROM users WHERE id = ?';

        db.db.get(sql, [userId], async (err, user) => {
          if (err) {
            reject(err);
            return;
          }

          if (!user) {
            reject(new Error('User not found'));
            return;
          }

          // Verify old password
          const validPassword = await bcrypt.compare(oldPassword, user.password);

          if (!validPassword) {
            reject(new Error('Current password is incorrect'));
            return;
          }

          // Hash new password
          const hashedPassword = await bcrypt.hash(newPassword, 10);

          // Update password
          const updateSql = 'UPDATE users SET password = ? WHERE id = ?';

          db.db.run(updateSql, [hashedPassword, userId], function(err) {
            if (err) {
              reject(err);
            } else {
              resolve({ success: true, changes: this.changes });
            }
          });
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = new AuthService();
