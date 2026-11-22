import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRemainingEntities1795290229863 implements MigrationInterface {
    name = 'AddRemainingEntities1795290229863'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`userprofile\` (\`ProfileID\` int NOT NULL AUTO_INCREMENT, \`UserID\` int NOT NULL, \`PhoneNumber\` varchar(20) NULL, \`Address\` varchar(255) NULL, UNIQUE INDEX \`REL_77426aead5280db2efbbadc0d5\` (\`UserID\`), PRIMARY KEY (\`ProfileID\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`customerorder\` (\`OrderID\` int NOT NULL AUTO_INCREMENT, \`OrderNumber\` varchar(30) NOT NULL, \`CustomerID\` int NULL, \`CashierID\` int NOT NULL, \`OrderDate\` datetime NOT NULL, \`OrderStatus\` varchar(20) NOT NULL, \`TotalAmount\` decimal(10,2) NOT NULL, UNIQUE INDEX \`IDX_e124ae10b6a2e554bfa5132e11\` (\`OrderNumber\`), PRIMARY KEY (\`OrderID\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`orderdetail\` (\`OrderDetailID\` int NOT NULL AUTO_INCREMENT, \`OrderID\` int NOT NULL, \`MenuItemID\` int NOT NULL, \`Quantity\` int NOT NULL, \`UnitPrice\` decimal(10,2) NOT NULL, \`Subtotal\` decimal(10,2) NOT NULL, PRIMARY KEY (\`OrderDetailID\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`notification\` (\`NotificationID\` int NOT NULL AUTO_INCREMENT, \`UserID\` int NOT NULL, \`MenuItemID\` int NULL, \`NotificationType\` varchar(30) NOT NULL, \`Message\` varchar(255) NOT NULL, \`CreatedAt\` datetime NOT NULL, \`IsRead\` tinyint NOT NULL DEFAULT 0, PRIMARY KEY (\`NotificationID\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`userprofile\` ADD CONSTRAINT \`FK_77426aead5280db2efbbadc0d58\` FOREIGN KEY (\`UserID\`) REFERENCES \`user\`(\`UserID\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`customerorder\` ADD CONSTRAINT \`FK_a39b694d0b38a110975440ab40a\` FOREIGN KEY (\`CustomerID\`) REFERENCES \`user\`(\`UserID\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`customerorder\` ADD CONSTRAINT \`FK_7c55e1d5e393e96ba0040011808\` FOREIGN KEY (\`CashierID\`) REFERENCES \`user\`(\`UserID\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`orderdetail\` ADD CONSTRAINT \`FK_e029bb0b5d17b6880f590ca3278\` FOREIGN KEY (\`OrderID\`) REFERENCES \`customerorder\`(\`OrderID\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`orderdetail\` ADD CONSTRAINT \`FK_28f095f43dff71360519b5ca231\` FOREIGN KEY (\`MenuItemID\`) REFERENCES \`menuitem\`(\`MenuItemID\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`notification\` ADD CONSTRAINT \`FK_a40d21f25165a4b79b2db230443\` FOREIGN KEY (\`UserID\`) REFERENCES \`user\`(\`UserID\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`notification\` ADD CONSTRAINT \`FK_0777a4811ff6fa66e00634a6276\` FOREIGN KEY (\`MenuItemID\`) REFERENCES \`menuitem\`(\`MenuItemID\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`notification\` DROP FOREIGN KEY \`FK_0777a4811ff6fa66e00634a6276\``);
        await queryRunner.query(`ALTER TABLE \`notification\` DROP FOREIGN KEY \`FK_a40d21f25165a4b79b2db230443\``);
        await queryRunner.query(`ALTER TABLE \`orderdetail\` DROP FOREIGN KEY \`FK_28f095f43dff71360519b5ca231\``);
        await queryRunner.query(`ALTER TABLE \`orderdetail\` DROP FOREIGN KEY \`FK_e029bb0b5d17b6880f590ca3278\``);
        await queryRunner.query(`ALTER TABLE \`customerorder\` DROP FOREIGN KEY \`FK_7c55e1d5e393e96ba0040011808\``);
        await queryRunner.query(`ALTER TABLE \`customerorder\` DROP FOREIGN KEY \`FK_a39b694d0b38a110975440ab40a\``);
        await queryRunner.query(`ALTER TABLE \`userprofile\` DROP FOREIGN KEY \`FK_77426aead5280db2efbbadc0d58\``);
        await queryRunner.query(`DROP TABLE \`notification\``);
        await queryRunner.query(`DROP TABLE \`orderdetail\``);
        await queryRunner.query(`DROP INDEX \`IDX_e124ae10b6a2e554bfa5132e11\` ON \`customerorder\``);
        await queryRunner.query(`DROP TABLE \`customerorder\``);
        await queryRunner.query(`DROP INDEX \`REL_77426aead5280db2efbbadc0d5\` ON \`userprofile\``);
        await queryRunner.query(`DROP TABLE \`userprofile\``);
    }

}
