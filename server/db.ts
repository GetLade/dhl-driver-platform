import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, n8nWebhookData, InsertN8nWebhookData } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Save or update webhook data from n8n
 */
export async function saveN8nWebhookData(dataType: string, payload: unknown): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save n8n webhook data: database not available");
    return;
  }

  try {
    const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
    
    // Check if data type already exists
    const existing = await db
      .select()
      .from(n8nWebhookData)
      .where(eq(n8nWebhookData.dataType, dataType))
      .limit(1);

    if (existing.length > 0) {
      // Update existing record
      await db
        .update(n8nWebhookData)
        .set({ payload: payloadStr, updatedAt: new Date() })
        .where(eq(n8nWebhookData.dataType, dataType));
    } else {
      // Insert new record
      await db.insert(n8nWebhookData).values({
        dataType,
        payload: payloadStr,
      });
    }
  } catch (error) {
    console.error("[Database] Failed to save n8n webhook data:", error);
    throw error;
  }
}

/**
 * Get the latest webhook data for a specific type
 */
export async function getN8nWebhookData(dataType: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get n8n webhook data: database not available");
    return undefined;
  }

  try {
    const result = await db
      .select()
      .from(n8nWebhookData)
      .where(eq(n8nWebhookData.dataType, dataType))
      .limit(1);

    if (result.length === 0) return undefined;

    const record = result[0];
    return {
      ...record,
      payload: JSON.parse(record.payload),
    };
  } catch (error) {
    console.error("[Database] Failed to get n8n webhook data:", error);
    throw error;
  }
}

/**
 * Get all webhook data records
 */
export async function getAllN8nWebhookData() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get n8n webhook data: database not available");
    return [];
  }

  try {
    const results = await db
      .select()
      .from(n8nWebhookData)
      .orderBy(desc(n8nWebhookData.updatedAt));

    return results.map(record => ({
      ...record,
      payload: JSON.parse(record.payload),
    }));
  } catch (error) {
    console.error("[Database] Failed to get all n8n webhook data:", error);
    throw error;
  }
}
