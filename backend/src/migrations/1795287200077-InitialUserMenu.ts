import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialUserMenu1795287200077 implements MigrationInterface {
    name = 'InitialUserMenu1795287200077'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`User\` (\`UserID\` int NOT NULL AUTO_INCREMENT, \`FullName\` varchar(100) NOT NULL, \`Email\` varchar(150) NOT NULL, \`PasswordHash\` varchar(255) NOT NULL, \`Role\` varchar(20) NOT NULL, \`IsActive\` tinyint NOT NULL DEFAULT 1, \`CreatedAt\` datetime NOT NULL, UNIQUE INDEX \`IDX_2f56f7040c2b05fc8f08a113f7\` (\`Email\`), PRIMARY KEY (\`UserID\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`MenuItem\` (\`MenuItemID\` int NOT NULL AUTO_INCREMENT, \`ItemName\` varchar(100) NOT NULL, \`Category\` varchar(50) NOT NULL, \`Description\` varchar(255) NULL, \`Price\` decimal(10,2) NOT NULL, \`StockQuantity\` int NOT NULL DEFAULT '0', \`MinimumStockLevel\` int NOT NULL DEFAULT '5', \`IsAvailable\` tinyint NOT NULL DEFAULT 1, \`CreatedAt\` datetime NOT NULL, PRIMARY KEY (\`MenuItemID\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`MenuItem\``);
        await queryRunner.query(`DROP INDEX \`IDX_2f56f7040c2b05fc8f08a113f7\` ON \`User\``);
        await queryRunner.query(`DROP TABLE \`User\``);
    }

}
